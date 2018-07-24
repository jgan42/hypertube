'use strict';

const childProcess = require('child_process');
const TorrentParser = require('./torrent-parser');
const firebase = require('./firebase');
const config = require('../_config');
const converter = require('./converter');

class Pieces {

  constructor(torrent, peers) {
    const size = torrent.pieces.length;

    this._requested = this._buildArray(size, torrent);
    this._received = this._buildArray(size, torrent);
    this._blocks = this._buildArray(size, torrent, true);

    this._torrent = torrent;
    this._peers = peers;
    this._startingOffset = 0;

    console.log('  Pieces to download :', size);
    console.log('  Blocks per pieces :', this._requested[0].length);

    this._watchFilesAndSpeed();
    this._startingOffsetRef = this._watchStartingOffset();
  }

  /**
   * @param pieceBlock
   * @param {boolean} value
   */
  setRequested(pieceBlock, value) {
    const blockIndex = pieceBlock.begin / config.BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = value;
  }

  /**
   * @param pieceBlock
   */
  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / config.BLOCK_LEN;
    this._received[pieceBlock.index][blockIndex] = true;
  }

  /**
   * @return {boolean}
   */
  isDone() {
    const isDone = this._received.every(blocks => blocks.every(b => b));
    if (isDone) {
      this._startingOffsetRef.off();
    }
    return isDone;
  }

  /**
   * @param wire
   * @param {boolean} fromStart
   * @return {*}
   */
  getFirstNeededBlock(wire, fromStart = false) {
    let i = fromStart ? 0 : Math.floor(this._startingOffset / this._torrent.pieceLength);
    let j = fromStart ? 0 : Math.floor((this._startingOffset % this._torrent.pieceLength) / config.BLOCK_LEN);
    const blockIndex = this._requested[i].indexOf(false, j);
    if (wire.peerPieces.get(i) && blockIndex !== -1) {
      return this._blocks[i][blockIndex];
    }
    for (i; this._requested[i]; i++) {
      const blockIndex = this._requested[i].indexOf(false);
      if (wire.peerPieces.get(i) && blockIndex !== -1) {
        return this._blocks[i][blockIndex];
      }
    }
    if (!fromStart) {
      return this.getFirstNeededBlock(wire, true);
    }
  }

  /**
   * @param wire
   * @return {*}
   */
  getExtremaBlock(wire) {
    for (let file of this._torrent.files.filter(file => file.readable)) {
      let i = Math.floor((file.offset + file.length) / this._torrent.pieceLength);
      let j = Math.floor(((file.offset + file.length) % this._torrent.pieceLength) / config.BLOCK_LEN);

      for (let count = 200; count; count--) {
        if (wire.peerPieces.get(i) && this._requested[i][j] === false) {
          return this._blocks[i][j];
        }
        const indexes = this._previousIndex(i, j);
        i = indexes.i;
        j = indexes.j;
      }
    }
  }

  _previousIndex(i, j) {
    if (j - 1 >= 0) {
      return { i, j: j - 1 };
    }
    if (i - 1 >= 0) {
      return { i: i - 1, j: this._blocks[i - 1].length - 1 };
    }
    return { i, j };
  }

  printProgress(print = '') {
    const percent = Math.floor(this._torrent.downloadedLength / this._torrent.length * 100);
    const bytesLeft = this._torrent.length - this._torrent.downloadedLength;
    const timeLeft = Math.round(bytesLeft / (this._torrent.currentSpeed || 1));

    let connectedPeers = 'Connected peers : (';
    connectedPeers += this._peers.filter(a => a.isDownloading).length + ')';
    connectedPeers += this._peers.filter(a => a.connected).length + '/';
    connectedPeers += this._peers.length + '\n';

    print += connectedPeers;

    this._torrent.connectedPeers = connectedPeers;
    this._torrent.percent = percent;
    this._torrent.timeLeft = timeLeft;

    //let blocks = '';
    //this._received.forEach((piece, i) => {
    //  if (blocks.length > 12000) {
    //    return;
    //  }
    //  blocks += piece.every(a => a) ? '|' : '.';
    //  //piece.forEach((b, j) => {
    //  //  let char = this._requested[i][j] ? ':' : '.';
    //  //  blocks += (b ? '|' : char);
    //  //
    //  //  if (!(blocks.length % 220)) {
    //  //    blocks += '\n';
    //  //  }
    //  //});
    //  //blocks += '/';
    //});
    print += 'SPEED: ' + Math.floor(this._torrent.currentSpeed / 1024) + 'kB/s\n';
    print += 'PROGRESS: ' + percent + '%\n';
    print += 'Estimated time left: ' + timeLeft + 's\n';
    //print += blocks + '\n';

    //console.log(print);
  }

  /**
   * @private
   */
  _watchFilesAndSpeed() {
    const interval = setInterval(() => {
      this._torrent.currentSpeed = this._peers.filter(a => a.isDownloading)
        .reduce((a, b) => a + b.wire.downloadSpeed(), 0);

      const files = this._torrent.files;
      files.forEach((file, i) => {
        file.percent = Math.floor(file.downloadedLength / file.length * 100);
        file.status = file.downloadedLength === file.length ? 'completed' : 'pending';
        if (this._startingOffset >= file.offset && this._startingOffset < file.offset + file.length) {
          if (file.status === 'pending') {
            file.status = 'downloading';
          }
          else {
            this._startingOffset = files[i + 1] ? files[i + 1].offset : 0;
          }
        }
        if (file.readable !== 'convert' && !file.duration && file.status === 'downloading') {
          return this._getVideoDuration(file);
        }
        if (file.readable) {
          file.ready = file.status === 'completed';
          const timeLeft = (file.length - file.downloadedLength) / (this._torrent.currentSpeed || 1);
          if (file.status === 'downloading' && timeLeft + 5 < (file.duration || 7200) && file.ranges.length) {
            const start = file.ranges[0].split('-').map(value => parseInt(value, 10));
            if (!start[0] && start[1] > (15 * file.length / (file.duration || 7200))) {
              file.ready = true;
            }
          }
          if (file.status === 'completed' && file.readable !== 'readable') {
            converter.addToQueue(file);
          }
        }
      });
      firebase.updateFilesAndSpeed(this._torrent);
      if (this.isDone() && !converter.isConverting()) {
        clearInterval(interval);
      }
    }, 1000);
  }

  /**
   * @return {*}
   * @private
   */
  _watchStartingOffset() {
    const ref = firebase.getStartingOffsetRef(this._torrent.infoHash);

    ref.on('value', (snap) => this._startingOffset = snap.val() || 0);
    return ref;
  }

  _getVideoDuration(file) {
    const command = (process.env.FFPROBE_BIN_PATH || 'ffprobe') + ' -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ';
    const path = this._torrent.localDir + file.name;

    childProcess.exec(command + path, (err, stdout) => {
      if (err) {
        return;
      }
      file.duration = parseInt(stdout) || null;
    });
  }

  /**
   * @param {number} size
   * @param torrent
   * @param {boolean} isBlock
   * @return {Array}
   * @private
   */
  _buildArray(size, torrent, isBlock = false) {
    const pieces = new Array(size).fill(null);
    return pieces.map((_, pieceIndex) => {
      const blocks = new Array(TorrentParser.blocksPerPiece(torrent, pieceIndex)).fill(false);

      if (isBlock) {
        return blocks.map((_, blockIndex) => {
          return {
            index: pieceIndex,
            begin: blockIndex * config.BLOCK_LEN,
            length: TorrentParser.blockLength(torrent, pieceIndex, blockIndex),
          }
        })
      }
      return blocks;
    });
  }

}

module.exports = Pieces;
