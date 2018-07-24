export const environment = {
  production: true,
  server: {
    protocol: 'http',
    hostname: 'localhost',
    port: 8080,
    host: 'http://localhost:8080',
  },
  firebase: {
    apiKey: 'AIzaSyA2FZs81DzsTJPi1Gbs4J643SksO5y0Ack',
    authDomain: 'hypertube-b642e.firebaseapp.com',
    databaseURL: 'https://hypertube-b642e.firebaseio.com',
    projectId: 'hypertube-b642e',
    storageBucket: 'hypertube-b642e.appspot.com',
    messagingSenderId: '847951581916',
  },
  torrentsProviders: [
    'yts',
    '1337x',
  ],
};
