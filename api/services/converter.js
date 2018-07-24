'use strict';

const ffmpeg = require('fluent-ffmpeg');

class ConverterService {

  constructor() {
    this._convertionQueue = [];
    this._converting = null;
  }

  isConverting() {
    return this._convertionQueue.length || this._converting;
  }

  addToQueue(file) {
    if (file.converting) {
      return;
    }
    file.converting = {
      status: 'waiting',
      time: 0,
      percent: 0,
    };
    this._convertionQueue.push(file);
    if (!this._converting) {
      this._convert();
    }
  }

  _convert() {
    if (!this._convertionQueue.length) {
      return;
    }
    this._converting = true;
    const file = this._convertionQueue.shift();
    const convertedPath = file.path.replace(/\..{3,4}$/, '.webm');
    let startTime = new Date().getTime();
    file.converting.status = 'converting';

    ffmpeg(file.path, {preset: 'ultrafast'})
      .videoCodec('libvpx')
      .audioCodec('libvorbis')
      .format('webm')
      .outputOptions([
        '-threads 4',
        '-deadline realtime',
        '-error-resilient 1'
      ])
      .output(convertedPath)
      .on('progress', (progress) => {
        const newTime = (100 - progress.percent) * (new Date().getTime() - startTime) / progress.percent;
        file.converting.time = Math.round(newTime / 1000) || 0;
        file.converting.percent = Math.floor(progress.percent) || 0;
      })
      .on('error', (err) => {
        file.converting.error = err.message;
        file.converting.status = 'ERROR';
        this._converting = false;
        this._convert();
      })
      .on('end', () => {
        file.converting.status = 'completed';
        file.converted = file.name.replace(/\..{3,4}$/, '.webm');
        this._converting = false;
        this._convert();
      })
      .run();
  }

}

module.exports = new ConverterService();
