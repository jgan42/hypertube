'use strict';

const config = require('../_config');
const axios = require('axios');
const cheerio = require('cheerio');
const ptn = require('parse-torrent-name');
const td = require('./torrent-parser');
const subtitles = require('./subtitles');

class ScrapService {

  constructor() {

  }

  async top(req, res) {
    const source = req.query.source;
    const providers = config.providers;
    const provider = providers[source];

    if (!provider) {
      return res.status(400).json({
        status: 400,
        message: 'Provider not found.',
      })
    }

    const url = `${provider.base}/${provider.top}`;

    try {
      const scrapResList = await axios.get(url);
      const $ = cheerio.load(scrapResList.data);

      const promises = [];
      const that = this;
      $(provider.selectors.listItems).each(function () {
        const url = $(this).attr('href');
        promises.push(that.fetchMovie(url, provider))
      });

      let movies = await Promise.all(promises);
      res.status(200).json({
        provider: source,
        length: movies.length,
        movies: movies,
      });
    } catch (err) {
      console.log('Top-list error :', err);
      return res.status(400).json({
        status: 400,
        message: 'Unknown error.',
      })
    }
  }

  async search(req, res) {
    const source = req.query.source;
    const providers = config.providers;
    const provider = providers[source];

    if (!provider) {
      return res.status(400).json({
        status: 400,
        message: 'Provider not found.',
      })
    }

    const query = decodeURIComponent(req.query.query);
    const page = req.query.page || provider.pageStart;
    let searchUrl = provider.search.replace('{query}', query).replace('{page}', page);

    if (source === 'yts' && page === '1') {
      searchUrl = searchUrl.replace('?page=1', '');
    }

    try {
      const scrapResList = await axios.get(`${provider.base}/${searchUrl}`);
      const $ = cheerio.load(scrapResList.data);

      const promises = [];
      const that = this;
      $(provider.selectors.listItems).each(function () {
        const url = $(this).attr('href');
        promises.push(that.fetchMovie(url, provider))
      });

      let movies = await Promise.all(promises);
      res.status(200).json({
        pagination: {
          current: page,
          ended: movies.length < provider.maxResults,
        },
        provider: source,
        length: movies.length,
        movies: movies,
      });

    } catch (err) {
      console.log('search', err.message);
      res.status(200).json({});
    }
  }

  async fetchMovie(url, provider) {
    try {
      const scrapResShow = await axios.get(provider.isFullUrl ? url : provider.base + url);
      const $$ = cheerio.load(scrapResShow.data);
      let movie = {};

      movie.raw = $$(provider.selectors.show.title).text();
      movie.torrent = $$(provider.selectors.show.torrent).attr('href');
      movie.url = provider.isFullUrl ? url : provider.base + url;
      movie.infoHash = await td.getInfoHash(movie.torrent);

      if (provider.selectors.show.subtitles) {
        movie.subtitles = $$(provider.selectors.show.subtitles).attr('href');
        movie.imdb = movie.subtitles.split('/').pop();
        subtitles.parse(movie.infoHash, movie.subtitles).catch(error => console.warn(error));
      }

      const parse = ptn(movie.raw);

      movie = { ...movie, ...parse };

      return movie;
    } catch (e) {
      console.log('fetchMovie', e.message);
      return null;
    }
  }

  async omdb(req, res) {
    try {
      let params;
      if (req.query.imdb) {
        params = {
          i: req.query.imdb,
          apiKey: config.omdb,
        }
      } else {
        const title = req.query.title.replace(/[A-Z]+(\s|$)/g, '').trim();
        params = {
          t: title,
          y: req.query.year || '',
          apiKey: config.omdb,
        }
      }
      const result = await axios.get('http://www.omdbapi.com', {
        params: params,
        timeout: 1000,
      });
      res.status(200).json(result.data);
    } catch (err) {
      console.log('omdb', err.message);
      res.status(200).json(null);
    }
  }
}

module.exports = new ScrapService();
