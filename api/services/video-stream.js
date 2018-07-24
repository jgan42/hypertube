'use strict';

const Buffer = require('buffer')['Buffer'];
const fs = require('fs');
const Transcoder = require('stream-transcoder');
const { Readable } = require('stream');
const firebase = require('./firebase');
const config = require('../_config');

class videoStreamService {

  stream(req, res) {
    const infoHash = req.params.infoHash || '';
    const fileName = decodeURIComponent(req.params.fileName || '');
    const filePath = `${config.baseDir}/${infoHash}/${fileName}`;
    let fileStat = null;

    try {
      fileStat = fs.statSync(filePath);
    }
    catch (e) {
      return res.status(404).send('KO');
    }

    const size = fileStat.size;
    const range = req.headers.range;
    const isChrome = !!req.headers['user-agent'].match(/Chrome\//);

    if (!range) {
      return res.sendStatus(416);
    }
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0]);
    const end = parts[1] ? parseInt(parts[1]) : size - 1;
    let extension = filePath.split('.').pop();

    if (end < start) {
      return res.status(416).send('KO');
    }
    firebase.updateLastView(infoHash);
    if (extension.match(/(ogg)|(webm)|(mp4)|(ogv)/i) || (isChrome && extension.match(/mkv/i))) {
      return this._handleCanStream(res, infoHash, fileName, filePath, size, extension, start, end);
    }
    if (isChrome) {
      return this._handleConversion(res, infoHash, fileName, filePath, size);
    }
    res.status(400).send('KO')
  }

  _handleCanStream(res, infoHash, fileName, filePath, size, extension, start, end) {
    const filesRef = firebase.getRef(infoHash).child('files');
    const stream = fs.createReadStream(filePath, { start, end });
    filesRef.on('value', snap => {
      const files = snap.val();
      const file = files ? files.find(file => fileName === file.name || fileName === file.converted) : null;
      if (!file || !file.ranges) {
        return;
      }
      firebase.getStartingOffsetRef(infoHash).set(start + file.offset);
      let contentLength = 0;
      for (let range of file.ranges) {
        const rangeArray = range.split('-').map(value => parseInt(value));
        if (start >= rangeArray[0] && start < rangeArray[1]) {
          contentLength = rangeArray[1] - start;
          break;
        }
      }
      if (file.name === file.converted) {
        contentLength = end - start + 1;
      }
      if (!contentLength) {
        return;
      }
      filesRef.off();
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': contentLength,
        'Content-Type': 'video/' + extension,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '-1',
        'Pragma': 'no-cache',
      });
      stream.pipe(res);
    });
  }

  _handleConversion(res, infoHash, fileName, filePath, size) {
    let currentOffset = 0;
    let files = null;
    let file = null;
    const filesRef = firebase.getRef(infoHash).child('files');
    const fd = fs.openSync(filePath, 'r');
    const stream = new Readable({
      read() {
      },
    });
    const converter = new Transcoder(stream)
      .videoCodec('h264')
      .audioCodec('aac')
      .format('mp4')
      .on('finish', () => {
        console.log('live conversion finished');
      })
      .on('error', (err) => {
        console.log('Transcoder err', err);
        res.status(401).send('KO');
      })
      .stream();
    converter.pipe(res);

    filesRef.on('value', snap => {
      files = snap.val();
      file = files ? files.find(file => fileName === file.name) : null;
      if (!file || !file.ranges) {
        return;
      }
      const start = file.ranges[0].split('-').map(value => parseInt(value));
      const buffSize = config.BLOCK_LEN * 32;
      while (start[0] === 0 && start[1] > currentOffset) {
        const diff = Math.min(start[1] - currentOffset, buffSize);
        const buffer = Buffer.alloc(diff);
        fs.readSync(fd, buffer, 0, diff, null);
        stream.push(buffer);
        currentOffset += diff;
      }
      if (currentOffset === size) {
        stream.push(null);
        filesRef.off();
      }
    });
  }

}

module.exports = new videoStreamService();
