'use strict';

const firebase = require('./firebase');

class Peer {

  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
    this.socket = null;
    this.wire = null;

    this.choked = true;
    this.isDownloading = false;
    this.error = '';
    this.connected = null;
    this.attempts = 0;
  }

  reset() {
    if (this.socket) {
      this.socket.destroy();
    }
    if (this.wire) {
      this.wire.destroy();
    }
    this.socket = null;
    this.wire = null;

    this.choked = true;
    this.isDownloading = false;
    this.error = '';
    this.connected = null;
  }

  /**
   * @param {string} event
   */
  pushEvent(event) {
    // debug
    //this.events = this.events || [];
    //this.events.push(event);
    //this.log();
  }

  log() {
    // debug
    //firebase.log(this.ip, {
    //  port: this.port,
    //  connected: this.connected,
    //  events: this.events,
    //  attempts: this.attempts,
    //});
  }

}

module.exports = Peer;
