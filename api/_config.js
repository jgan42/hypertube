'use strict';

const config = {
  httpPort: 8080,
  firebase: {
    serviceAccount: {
      'type': 'service_account',
      'project_id': 'hypertube-b642e',
      'private_key_id': '492c1c7a2fe4faebf0a730b97d4367912635e82e',
      'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDElByfuM/3sb0Y\nqbOisENknKW3CGPwy2xDgoW/vSKsSPJE5j62H81CechO4T496AQ0tq8IH//LVXyD\nbyu6KL3AjGlpoCBre4de8kd9SpGNDlgBI0hx3K78BCyBxIvwK5SaMJg5yUrpVxxl\nUW58IjOPE/Icj6/DEmtrilk4SIsOSC3s0QVOf0aMGG3FFdGFphAuPYTALn9sBk0C\neRdA1GJT3/lR8UXWZZkqXFJ1c/88kZH+++4N9j1yM1HGgLYY3Lx4l1lk4VLB//+5\nwC2jS/NbV9xKTvmLzM1xqf/mZpWEzLGJgDnfjTQrbP38a3zqzDKGf1I0bnBIEL9r\nbI9oTGNLAgMBAAECggEAPAauJuecOZqAj4NiYw9HxPVAdP+O5Px49rRoewAaElnE\nAN390EctulrNm6iUBPtQLXiLQgPjbAeSmd/cjl/acW1u0t4eiDOURp3czplykIwM\nu2w2tu4YUMRFguqtgI0ON3cXRK3+vfnnpdiT0DvxWoNQrwABP6PkQVZhoBomvBkt\nP5YgWNvuVZwk3vbkpvhrjpfNzVqFX5+aDCmJD1aG2L4E/6zeoFPnpVMyYM41Dthg\nQecmpkuL9e7NebJO8MEd4q0cmjYRpdmt5HxndudivEXgLtQg/pYL1BWjFjg7Qmkv\nKZSLYrgYdiECaD/4uJp9iyomM2UKFRDPK3PEx2QNAQKBgQDmbuksvj+e+KeknY45\nxAUbCFT/u3VYp7Vyooxosn4S5+vVxafFsDlB2iXaMJ3u++xTkmcwVYW32cf2syl2\ngvKV/wp7aMMdzquUW2IjM9kXVWuWGXfZDRVP2zXQPu64tBqkmE4TNIQuueMnIrKq\nNFZudMx9D6TkPfai0ZoVKB7NYQKBgQDaY5zVJepQhGqQAnxxWwVErYPdUmTkUllt\nl3/udI2Yp4DvOzYG3NCyezW0wD/BYx2A0A/L0x8vWy9+yQu234vp8bVnBl5tFZIU\n6n2c5AbsJVVEi1rWxsaA4u7mlhRRwSJl8P62qv2e+V/Fb9J/ZtnGP4zY9i6JTPF6\n9CZKNqZkKwKBgQCykGXOj0q7xNIcBR+ucdDHBujfFwOzBJrdz0pg41hBDEk7aaQ9\n0/Y6qnJEpwHrrHqQtFWUJeGt+2wyJtnNhWG4jF8yDJeOZJWfLEVbJBVpOH9bXDb8\nEmBedm84BVx18tLmk0OFLF/12YRF0mSC8nW7uHSxwMq1N7MErsno9SMRYQKBgGiF\nYFxLRze+CFpgNjryezUBbqkQdCUqnI5tAdeYhORY1saoqhTivieN/IhDsr/Vthse\neVDt/HDnzXV6t1aQ6x/OhSmHzM2ck0vbZr8eC4od3A9wOsusWvj4o6pMjfEK5HGx\nw9adQ8FATOvrtu0uxm+xnrGAMYmY/8H+9Ax013H9AoGBAKRkpzocCmH+38lu6OQ4\nt9OubNXY5UVxS855LQusFNI0ODtZ2t16D0BdBVCZs0L8Ic/y8KHJvul4UVKUJasJ\n19rxP4fGyN/fSAlyWNsBQjVmkidBXPSJj/YXdN1b8zpUxd1fTZfGP08LZOQKMd8Y\nyVbYw5G0OmAY94vtVLznJPrY\n-----END PRIVATE KEY-----\n',
      'client_email': 'firebase-adminsdk-ml52h@hypertube-b642e.iam.gserviceaccount.com',
      'client_id': '114343935914666216486',
      'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
      'token_uri': 'https://accounts.google.com/o/oauth2/token',
      'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
      'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ml52h%40hypertube-b642e.iam.gserviceaccount.com',
    },
    databaseURL: 'https://hypertube-b642e.firebaseio.com',
  },
  BLOCK_LEN: 16384, // ie: 2^14
  baseDir: '/Volumes/Storage/goinfre/ohamon',
  // baseDir: 'public',
  videoFormats: {
    ogg: 'readable',
    webm: 'readable',
    mp4: 'readable',
    ogv: 'readable',
    mkv: 'chrome',
    avi: 'convert',
    mov: 'convert',
    wmv: 'convert',
  },
  credentials: {
    '42': {
      endpoint: "https://api.intra.42.fr",
      client_id: "686d93faa1b8a227a14bac7f136ad72ccb6ece898e7ec94702520e37da5cde7b",
      client_secret: "369711a26e84991c7ad221a78a5ce182737eeb6bfdd9c94ff929e2cd20211513"
    }
  },
  omdb: '1f58d1c6',
  providers: {
    torrent9: {
      base: 'http://www.torrent9.ec',
      search: 'search_torrent/films/{query}/page-{page}',
      top: 'top_torrent.php?filtre=films',
      pageStart: 0,
      maxResults: 50,
      isFullUrl: false,
      selectors: {
        listItems: 'table tr td:first-of-type a',
        show: {
          title: '.movie-section h5',
          image: '.movie-detail .movie-img img',
          torrent: '.movie-detail .download-btn:last-of-type a.download'
        }
      }
    },
    yts: {
      base: 'https://yts.am',
      search: 'browse-movies/{query}/all/all/0/alphabetical?page={page}',
      top: 'browse-movies/0/all/all/0/seeds',
      pageStart: 1,
      maxResults: 20,
      isFullUrl: true,
      selectors: {
        listItems: '.browse-content .browse-movie-wrap a.browse-movie-link',
        show: {
          title: '#movie-info .hidden-xs:first-of-type h1',
          image: '.movie-poster img',
          torrent: '.modal-download .magnet-download.download-torrent.magnet[href*="720"]',
          subtitles: '#movie-tech-specs .tech-spec-info .row:last-of-type .tech-spec-element:first-of-type a',
        }
      }
    },
    '1337x': {
      base: 'http://1337x.to',
      search: 'category-search/{query}/Movies/{page}/',
      top: 'top-100-movies',
      pageStart: 1,
      maxResults: 40,
      isFullUrl: false,
      selectors: {
        listItems: '.page-content table tr td.name a:last-of-type',
        show: {
          title: '.page-content h1',
          image: '.box-info-detail .torrent-detail img',
          torrent: '.box-info-detail .torrent-category-detail ul.download-links-dontblock li:first-of-type a'
        }
      }
    }
  }
};

module.exports = config;
