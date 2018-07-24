'use strict';

try {
  const pwd = require('child_process').execSync('pwd').toString('utf8').slice(0, -1);
  process.env.FFMPEG_BIN_PATH = pwd + '/bin/ffmpeg';
  process.env.FFMPEG_PATH = pwd + '/bin/ffmpeg';
  process.env.FFPROBE_BIN_PATH = pwd + '/bin/ffprobe';
}
catch (e) {
  const pwd = require('child_process').execSync('cd').toString('utf8').slice(0, -2);
  process.env.FFMPEG_BIN_PATH = pwd + '/bin/ffmpeg.exe';
  process.env.FFMPEG_PATH = pwd + '/bin/ffmpeg';
  process.env.FFPROBE_BIN_PATH = pwd + '/bin/ffprobe.exe';
}

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./_config.js');
const scrap =  require('./services/scrap');
const oauth =  require('./services/oauth');

const hashList = [];

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use((req, res, next) => {

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE');

  console.log(`${(new Date()).toUTCString()} => Request on ${req.url} with body\n${JSON.stringify(req.body)}`);
  next();
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/scrap/search', scrap.search.bind(scrap));
app.get('/scrap/top', scrap.top.bind(scrap));
app.get('/scrap/omdb', scrap.omdb.bind(scrap));

app.get('/auth/:type/redirect', oauth.redirect.bind(oauth));
app.get('/auth/:type/handle', oauth.handle.bind(oauth));

app.post('/init-torrent', (req, res) => {
  const TorrentParser = require('./services/torrent-parser');
  if (!req.body.torrent) {
    return res.status(400).send('KO');
  }
  TorrentParser.initTorrent(res, req.body);
});

app.post('/download', (req, res) => {
  const TDownloader = require('./services/torrent-downloader');
  if (!req.body.linkOrMagnet) {
    return res.status(400).send('KO');
  }
  new TDownloader(res, req.body.linkOrMagnet, hashList);
});

app.get('/stream/:infoHash/:fileName', (req, res) => {
  const VideoStream = require('./services/video-stream');
  VideoStream.stream(req ,res);
});

app.get('/subs/:infoHash/:lang', (req, res) => {
  const subtitles = require('./services/subtitles');
  subtitles.send(req, res);
});

app.listen(config.httpPort, () => {
  console.log('listening on ', config.httpPort);

  const expirationChecker = require('./services/cron');
  new expirationChecker();
});

module.exports = app;
