'use strict';

const parseTorrent = require('parse-torrent');
const config = require('../_config');
const firebase = require('./firebase');

class TorrentParserService {

  /**
   * @param res
   * @param torrentScrap
   */
  static initTorrent(res, torrentScrap) {
    TorrentParserService.getInfoHash(torrentScrap.torrent)
      .then((infoHash) => {
        firebase.initTorrent(infoHash, torrentScrap);
        res.send({ infoHash });
      })
      .catch(err => {
        console.warn('err', err);
        res.status(400).send('KO');
      });
  }

  /**
   * @param fileOrLinkOrMagnetOrPath
   * @returns {Promise}
   */
  static getInfoHash(fileOrLinkOrMagnetOrPath) {
    return new Promise((resolve, reject) => {
      parseTorrent.remote(fileOrLinkOrMagnetOrPath, (err, torrent) => {
        if (err || !torrent) {
          reject(err || 'no torrent found');
          return null;
        }
        resolve(torrent.infoHash);
      });
    });
  }

  /**
   * @param fileOrLinkOrMagnetOrPath
   * @return {Promise}
   */
  static parse(fileOrLinkOrMagnetOrPath) {
    return new Promise((resolve, reject) => {
      parseTorrent.remote(fileOrLinkOrMagnetOrPath, (err, torrent) => {
        if (err || !torrent) {
          reject(err || 'no torrent found');
          return;
        }
        resolve(TorrentParserService.formatTorrent(torrent));
      });
    });
  }

  /**
   * @param torrent
   * @return {*}
   */
  static formatTorrent(torrent) {
    delete torrent['xt'];
    delete torrent['tr'];
    delete torrent['dn'];
    delete torrent['created'];
    delete torrent['createdBy'];
    delete torrent['comment'];
    delete torrent['urlList'];

    torrent.downloadedLength = 0;
    torrent.localDir = `${config.baseDir}/${torrent.infoHash}/`;
    torrent.currentSpeed = 0;
    return torrent;
  }

  /**
   * @param torrent
   * @param {number} pieceIndex
   * @return {number}
   */
  static blocksPerPiece(torrent, pieceIndex) {
    const pieceLength = TorrentParserService.pieceLength(torrent, pieceIndex);
    return Math.ceil(pieceLength / config.BLOCK_LEN);
  };

  /**
   * @param torrent
   * @param {number} pieceIndex
   * @param {number} blockIndex
   * @return {number}
   */
  static blockLength(torrent, pieceIndex, blockIndex) {
    const pieceLength = TorrentParserService.pieceLength(torrent, pieceIndex);

    const lastPieceLength = pieceLength % config.BLOCK_LEN;
    const lastPieceIndex = Math.floor(pieceLength / config.BLOCK_LEN);

    return blockIndex === lastPieceIndex ? lastPieceLength : config.BLOCK_LEN;
  };

  /**
   * @param torrent
   * @param {number} pieceIndex
   * @return {number}
   * @private
   */
  static pieceLength(torrent, pieceIndex) {
    const lastPieceIndex = Math.floor(torrent.length / torrent.pieceLength);

    return lastPieceIndex === pieceIndex ? torrent.lastPieceLength : torrent.pieceLength;
  }

}

module.exports = TorrentParserService;
