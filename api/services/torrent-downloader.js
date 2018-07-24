'use strict';

const fs = require('fs');
const net = require('net');
const bencode = require('bencode');
const BtProtocol = require('bittorrent-protocol');
const parseTorrent = require('parse-torrent');
const ut_metadata = require('ut_metadata');

const config = require('../_config');
const tracker = require('./tracker');
const TorrentParser = require('./torrent-parser');
const Peer = require('./peer');
const Pieces = require('./pieces');
const firebase = require('./firebase');

class TorrentDownloader {

  constructor(res, fileOrLinkOrMagnetOrPath, hashList) {
    this._torrent = null;
    this._peers = [];
    this._pieces = null;
    this._filesInitialized = false;
    this._queue = hashList;

    this._init(res, fileOrLinkOrMagnetOrPath);
  }

  _init(res, fileOrLinkOrMagnetOrPath) {
    console.log('PARSING TORRENT INPUT ...\n  ', fileOrLinkOrMagnetOrPath);
    TorrentParser.parse(fileOrLinkOrMagnetOrPath)
      .then(parsedTorrent => {
        console.log('  PARSED !');
        let infoHash = parsedTorrent.infoHash;
        this._torrent = parsedTorrent;
        res.send({ infoHash });

        if (this._queue.indexOf(infoHash) !== -1) {
          console.log('alreadyDownloading');
          return;
        }
        this._queue.push(infoHash);

        firebase.getRef(infoHash).once('value', snap => {
          const fbTorrent = snap.val();

          if (fbTorrent && fbTorrent.status === 'completed') {
            return this._queue.splice(this._queue.indexOf(infoHash), 1);
          }
          if (this._queue.length > 10) {
            this._queue.splice(this._queue.indexOf(infoHash), 1);
            return firebase.setStatus(infoHash, 'waiting');
          }
          if (!fbTorrent || !fbTorrent.status || fbTorrent.status !== 'completed') {
            firebase.setStatus(infoHash, 'init');
            return this._getPeers();
          }
        });
      })
      .catch(error => {
        console.warn('error', error);
        res.status(400).send('KO');
      })
  }

  /**
   * @private
   */
  _getPeers() {
    tracker.getPeers(this._torrent, newPeer => {
      if (!this._peers.find(_peer => newPeer.ip === _peer.ip)) {
        const peer = new Peer(newPeer.ip, newPeer.port);
        this._peers.push(peer);
        this._downloadFromPeer(peer);
      }
    });
  }

  /**
   * @param peer
   * @private
   */
  _downloadFromPeer(peer) {
    this._initSocket(peer);

    peer.socket.connect(peer.port, peer.ip, () => {
      this._initWire(peer);
      peer.socket.pipe(peer.wire).pipe(peer.socket);
      peer.wire.use(ut_metadata());

      peer.wire.handshake(this._torrent.infoHash, tracker.id, { dht: true });
      peer.wire.on('handshake', () => {
        peer.pushEvent('handshake');
        if (!this._torrent.info) {
          return peer.wire['ut_metadata'].fetch();
        }
        this._onMetadata(peer);
      });

      peer.wire['ut_metadata'].on('metadata', (rawMetadata) => {
        if (!this._torrent.info) {
          let metadata = bencode.decode(rawMetadata);
          this._torrent.info = metadata['info'];
          this._torrent = TorrentParser.formatTorrent(parseTorrent(bencode.encode(this._torrent)));
        }
        this._onMetadata(peer);
      });
    });
  }

  /**
   * @param peer
   * @private
   */
  _onMetadata(peer) {
    if (!this._pieces) {
      this._pieces = new Pieces(this._torrent, this._peers);
    }
    if (!this._filesInitialized) {
      if (!fs.existsSync(this._torrent.localDir)) {
        fs.mkdirSync(this._torrent.localDir);
      }
      this._torrent.files.sort((a, b) => a.offset - b.offset);
      this._torrent.files.forEach((file) => {
        delete file.path;
        let extension = file.name.split('.');
        extension = extension[extension.length - 1];
        extension = extension.toLowerCase();

        file.readable = config.videoFormats[extension] || false;
        file.path = this._torrent.localDir + file.name;
        file.localFile = fs.openSync(file.path, 'w');
        file.downloadedLength = 0;
        file.status = 'pending';
        file.percent = 0;
        file.ranges = [];
        if (file.name.match(/avi$/i)) {
          file.duration = 3600;
        }
      });
      this._filesInitialized = true;
      firebase.setStatus(this._torrent.infoHash, 'downloading');
    }
    peer.wire.interested();
  }

  /**
   * @param {Peer} peer
   * @private
   */
  _initSocket(peer) {
    peer.socket = new net.Socket();
    peer.socket.on('error', err => {
      peer.error = err.code;
      peer.log();
    });
    peer.socket.on('close', () => {
      peer.connected = false;
      peer.log();
      this._reconnectToPeer(peer);
    });
  }

  /**
   * @param {Peer} peer
   * @private
   */
  _initWire(peer) {
    peer.connected = true;
    peer.wire = new BtProtocol();
    peer.wire.setTimeout(5000);
    peer.wire.on('choke', () => {
      peer.pushEvent('choke');
      peer.choked = true;
    });
    peer.wire.on('unchoke', () => {
      peer.pushEvent('unchoke');
      peer.choked = false;
      this._requestBlock(peer);
    });
    peer.wire.on('have', () => {
      peer.pushEvent('have');
      this._requestBlock(peer);
    });
    peer.wire.on('bitfield', () => {
      peer.pushEvent('bitfield');
      this._requestBlock(peer);
    });
  }

  /**
   * @param {Peer} peer
   * @private
   */
  _requestBlock(peer) {
    if (peer.choked || peer.isDownloading || !this._pieces) {
      return;
    }
    let block = this._pieces.getExtremaBlock(peer.wire) || this._pieces.getFirstNeededBlock(peer.wire);

    if (block) {
      this._pieces.setRequested(block, true);
      peer.isDownloading = `[${block.index}|${block.begin / config.BLOCK_LEN}]`;
      peer.wire.request(block.index, block.begin, block.length, (err, receivedBlock) => {
        if (err) {
          peer.isDownloading = false;
          return this._pieces.setRequested(block, false);
        }
        this._receiveBlock(peer, block, receivedBlock);
      })
    }
  }

  /**
   * @param {Peer} peer
   * @param block
   * @param {Buffer} receivedBlock
   * @private
   */
  _receiveBlock(peer, block, receivedBlock) {
    peer.pushEvent('Got block !');
    peer.isDownloading = false;
    this._pieces.addReceived(block);

    let offset = block.index * this._torrent.pieceLength + block.begin;
    let rest = receivedBlock;
    let file = null;

    while (rest.length) {
      file = this._torrent.files
        .find(file => (file.offset <= offset) && (file.offset + file.length > offset));
      const toWrite = rest.slice(0, file.offset + file.length - offset);
      rest = rest.slice(file.offset + file.length - offset);
      fs.write(file.localFile, toWrite, 0, toWrite.length, offset - file.offset, () => null);
      file.downloadedLength += toWrite.length;
      this._torrent.downloadedLength += toWrite.length;
      this._updateRanges(file, toWrite, offset - file.offset);
      offset += toWrite.length;
    }
    this._pieces.printProgress();
    if (!this._checkIsDone(peer)) {
      this._requestBlock(peer);
    }
  }

  _updateRanges(file, toWrite, offset) {
    if (file.readable) {
      file.ranges.push(offset + '-' + (offset + toWrite.length));
      file.ranges.sort((a, b) => parseInt(a) - parseInt(b));
      let i = 0;
      while (file.ranges[i] && file.ranges[i + 1]) {
        const a = file.ranges[i].split('-');
        const b = file.ranges[i + 1].split('-');

        if (a[1] === b[0]) {
          file.ranges[i] = a[0] + '-' + b[1];
          file.ranges.splice(i + 1, 1);
        }
        else {
          i++;
        }
      }
    }
  }

  /**
   * @param {Peer} peer
   * @private
   */
  _checkIsDone(peer) {
    if (this._pieces.isDone()) {
      console.log('DONE', this._torrent.name);
      firebase.setStatus(this._torrent.infoHash, 'completed');
      tracker.destroy(this._torrent.infoHash);
      peer.socket.destroy();
      try {
        this._torrent.files
          .filter(file => file.localFile)
          .forEach(file => fs.closeSync(file.localFile));
      }
      catch (e) {}
      const index = this._queue.indexOf(this._torrent.infoHash);
      if (index > -1) {
        this._queue.splice(index, 1);
      }
      return true;
    }
  }

  /**
   * @param {Peer} peer
   * @private
   */
  _reconnectToPeer(peer) {
    peer.reset();
    if (++peer.attempts > 8) {
      return;
    }
    setTimeout(() => {
      this._downloadFromPeer(peer);
    }, peer.attempts * 3000)
  }

}

module.exports = TorrentDownloader;
