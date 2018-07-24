import {Injectable} from '@angular/core';
import {AngularFireWrapper} from './angularfire-wrapper.service';
import {map, switchMap} from 'rxjs/internal/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {BehaviorSubject} from 'rxjs/index';

@Injectable({
  providedIn: 'root',
})
export class VideoSearchService {

  _inputFocused$ = new BehaviorSubject(false);

  constructor(private afW: AngularFireWrapper,
              private http: HttpClient) {
  }

  getInputState() {
    return this._inputFocused$;
  }

  initTorrent(torrentScrap) {
    return this.http.post(environment.server.host + '/init-torrent', torrentScrap)
      .pipe(map(body => body['infoHash']));
  }

  getScrapRef(infoHash) {
    return this.afW.object('torrent_scraps/' + infoHash);
  }

  getTorrent(linkOrMagnet) {
    return this.http.post(environment.server.host + '/download', {linkOrMagnet})
      .pipe(
        map(body => body['infoHash']),
        switchMap(infoHash => this.afW.object('torrents/' + infoHash)
          .valueWithKey$()),
      );
  }

  getCommentsRef(infoHash) {
    return this.afW.list('torrent_comments/' + infoHash);
  }

  setStartingOffset(infoHash: string, offset: number) {
    this.afW.object('torrents/' + infoHash + '/starting_offset')
      .set(offset)
      .catch(error => console.warn(error));
  }
}
