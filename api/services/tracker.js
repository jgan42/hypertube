'use strict';

const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const BtTracker = require('bittorrent-tracker') || (() => {
  });

class TrackerService {

  constructor() {
    this.id = this._generateId();
    this._port = 6881;

    this._btTrackers = {};
    this._updaterWatchers = {};
  }

  /**
   * @param torrent
   * @param callback
   */
  getPeers(torrent, callback) {
    console.log('GETTING PEERS ...');
    const options = {
      infoHash: torrent.infoHashBuffer,
      peerId: this.id,
      announce: torrent.announce,
      port: this._port,
    };

    const btTracker = new BtTracker(options);
    this._btTrackers[torrent.infoHash] = btTracker;

    btTracker.start();
    btTracker.on('error', err => console.warn('  TRACKER error :', err.message));
    btTracker.on('peer', (address) => {
      address = address.split(':');
      callback({ ip: address[0], port: address[1] });
    });
    btTracker.update();
    this._updaterWatchers[torrent.infoHash] = setInterval(() => btTracker.update(), 30000);
  }

  /**
   * @param {string} infoHash
   */
  destroy(infoHash) {
    if (this._updaterWatchers[infoHash]) {
      clearInterval(this._updaterWatchers[infoHash]);
      delete this._updaterWatchers[infoHash];
    }
    if (this._btTrackers[infoHash]) {
      this._btTrackers[infoHash].destroy();
      delete this._btTrackers[infoHash];
    }
  }

  /**
   * The Id is unique per connexion
   * @return {Buffer|void}
   * @private
   */
  _generateId() {
    const id = crypto.randomBytes(20);

    Buffer.from('-HT0001-').copy(id, 0);
    return id;
  }

}

module.exports = new TrackerService();
