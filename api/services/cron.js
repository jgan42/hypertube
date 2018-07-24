'use strict';

const fs = require('fs');
const CronJob = require('cron').CronJob;
const config = require('../_config');
const firebase = require('./firebase');

class CronService {

  constructor() {
    this.deleteOld = new CronJob('* * * 1 * *', () => {
      console.log('Trigger cron');
      this._findAndDeleteExpired().catch(error => console.warn(error));;
    }, () => {
      console.log('Cron ended');
    }, true);
    console.log('Cron is Running :', this.deleteOld.running);
  }

  async _findAndDeleteExpired() {
    const now = new Date().getTime();
    const monthInMilliSec = 2592000000;

    try {
      let results = await firebase.lastViewsRef()
        .orderByValue()
        .endAt(now - monthInMilliSec)
        .once('value')
        .then(snap => snap.val());

      if (results) {
        Object.keys(results).forEach(key => {
          const path = `${config.baseDir}/${key}`;
          if (config.baseDir && typeof key === 'string') {
            console.log('Expired:', key);
            firebase.lastViewsRef().child(key).remove();
            firebase.getRef(key).remove();
            this._rmDir(path);
          }
        });
      }
    }
    catch (e) {
      return false;
    }
  }

  _rmDir(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file) => {
        const curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          this._rmDir(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

}

module.exports = CronService;
