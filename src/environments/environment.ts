// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
