'use strict';

const config = require('../_config.js');
const axios = require('axios');
const crypto = require('crypto');
const admin = require("./firebase").admin;

class OauthService {

  constructor() {
  }

  redirect(req, res) {
    const type = req.params.type;
    const credentials = config.credentials[type];

    if (!credentials) {
      return res.status(400).json({
        status: 400,
        message: 'Provider not found.'
      })
    }
    return res.redirect(`${credentials.endpoint}/oauth/authorize?client_id=${credentials.client_id}&response_type=code&redirect_uri=http://localhost:4200/authentication/sign-in`)
  }

  async handle(req, res) {
    const type = req.params.type;
    const credentials = config.credentials[type];

    // console.log(credentials, `${credentials.endpoint}/oauth/token`);

    if (!credentials) {
      return res.status(400).json({
        status: 400,
        message: 'Provider not found.'
      })
    }

    try {
      const token = await axios.post(`${credentials.endpoint}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        code: req.query.code,
        redirect_uri: 'http://localhost:4200/authentication/sign-in'
      });

      const user = await axios.get(`${credentials.endpoint}/v2/me`, {
        headers: {
          'Authorization': `Bearer ${token.data.access_token}`
        }
      });

      const fireToken = await admin.auth().createCustomToken(crypto.createHash('sha1').update('42_' + user.data.id).digest('hex'));

      return res.status(200).json({
        fireToken: fireToken,
        user: {
          login: user.data.login,
          email: user.data.email,
          first_name: user.data.first_name,
          last_name: user.data.last_name,
          picture_url: user.data.image_url,
        }
      })

    } catch (err) {
      console.log('OAuth', err.message);
      return res.status(400).json({
        status: 400,
        message: 'Unknown error.'
      });
    }
  }
}

module.exports = new OauthService();
