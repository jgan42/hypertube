'use strict';

class Firebase {

  constructor() {
    const config = require('../_config');
    this.admin = require('firebase-admin');

    this.admin.initializeApp({
      credential: this.admin.credential.cert(config.firebase.serviceAccount),
      databaseURL: config.firebase.databaseURL,
    });
    this.db = this.admin.database();
  }

  getTimestamp() {
    return this.admin.database.ServerValue.TIMESTAMP;
  }

  getScrapRef(infoHash) {
    return this.db.ref('torrent_scraps/' + infoHash);
  }

  initTorrent(infoHash, torrentScrap) {
    return this.getScrapRef(infoHash)
      .set(torrentScrap)
      .catch(error => console.warn('firebase scrap error', error));
  }

  getRef(infoHash) {
    return this.db.ref('torrents/' + infoHash);
  }

  setStatus(infoHash, status) {
    const ref = this.getRef(infoHash).child('status');

    ref.set(status)
      .catch(error => console.warn('error', error));
  }

  getStartingOffsetRef(infoHash) {
    return this.db.ref('torrents/' + infoHash + '/starting_offset');
  }

  updateFilesAndSpeed(torrent) {
    this.update(torrent.infoHash, {
      files: torrent.files.filter(file => file.readable),
      current_speed: torrent.currentSpeed,
      connected_peers: torrent.connectedPeers || '',
      percent: torrent.percent || '',
      time_left: torrent.timeLeft || '',
    })
  }

  lastViewsRef() {
    return this.db.ref('torrents_last_view/');
  }

  updateLastView(infoHash) {
    this.lastViewsRef(infoHash)
      .child(infoHash)
      .set(this.getTimestamp())
      .catch(error => console.warn(error));
  }

  log(ref, toLog) {
    this.db.ref('log/' + ref.replace(/\./g, '-')).set(toLog).catch(error => console.warn('error', error));
  }

  update(infoHash, data) {
    const ref = this.getRef(infoHash);
    ref.update(data).catch(error => console.warn(error));
  }

}

module.exports = new Firebase();
