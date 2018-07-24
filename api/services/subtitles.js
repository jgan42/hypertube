'use strict';

const fs = require('fs');
const unzip = require('unzip');
const axios = require('axios');
const cheerio = require('cheerio');
const srt2vtt = require('srt-to-vtt');
const config = require('../_config');
const firebase = require('./firebase');

class SubtitlesService {

  constructor() {
  }

  send(req, res) {
    const infoHash = req.params.infoHash;
    const lang = req.params.lang;
    const localDir = `${config.baseDir}/${infoHash}`;
    const path = `${localDir}/${lang}`;

    if (!infoHash || !lang) {
      res.sendStatus(400);
    }
    if (!fs.existsSync(localDir) || !fs.existsSync(path)) {
      res.sendStatus(404);
    }
    res.writeHead(200, {
      'Content-Type': 'text/vtt',
    });
    const stream = fs.createReadStream(path);
    stream.pipe(res);
  }

  async parse(infoHash, pageUrl) {
    try {
      const localDir = `${config.baseDir}/${infoHash}`;
      if (fs.existsSync(localDir)
        && fs.existsSync(localDir + '/fr.vtt') && fs.existsSync(localDir + '/en.vtt')) {
        return null;
      }
      const baseUrl = 'http://www.yifysubtitles.com';
      const scrapResShow = await axios.get(pageUrl);
      const $ = cheerio.load(scrapResShow.data);
      const frPage = $('a[href*="french"].subtitle-download').attr('href');
      const enPage = $('a[href*="english"].subtitle-download').attr('href');
      return await Promise.all([
        this._parseByLang(infoHash, baseUrl + frPage, 'fr'),
        this._parseByLang(infoHash, baseUrl + enPage, 'en'),
      ]);
    }
    catch (e) {
      return null;
    }
  }

  async _parseByLang(infoHash, langPageUrl, lang) {
    if (!langPageUrl) {
      return null;
    }
    try {
      const scrapResShow = await axios.get(langPageUrl);
      const $ = cheerio.load(scrapResShow.data);
      const subtitlesUrl = $('a.download-subtitle').attr('href');
      return this._get(infoHash, subtitlesUrl, lang);
    }
    catch (e) {
      return null;
    }
  }

  /**
   * @param infoHash
   * @param subtitlesUrl
   * @param lang
   * @return {*}
   * @private
   */
  _get(infoHash, subtitlesUrl, lang) {
    if (!subtitlesUrl) {
      console.log('NO subs found', infoHash);
      return Promise.resolve(null);
    }
    const localDir = `${config.baseDir}/${infoHash}`;
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir);
    }
    const subPath = `${localDir}/${lang}.vtt`;
    const file = fs.createWriteStream(subPath);

    return axios({
      method: 'get',
      url: subtitlesUrl,
      responseType: 'stream',
    }).then((response) => {
      return new Promise((res) => {
        response.data.pipe(unzip.Parse().on('error', handleError)).on('entry', (entry) => {
          const filePath = entry.path;
          if (filePath.match(/(srt)|(vtt)$/)) {
            entry.pipe(srt2vtt()).pipe(file);
          } else {
            entry.autodrain();
          }
          file.on('finish', () => {
            file.close();
            firebase.getRef(infoHash).child('subtitles/' + lang).set(true).catch(error => console.warn(error));
            // console.log('SUBS downloaded and converted !', subPath);
            res(subPath);
          }).on('error', handleError);
        }).on('error', handleError);
        function handleError() {
          res(null);
        }
      });
    });
  }
}

module.exports = new SubtitlesService();
