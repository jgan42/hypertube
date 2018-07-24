import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {VideoSearchService} from '../../services/video-search.service';
import {Router} from '@angular/router';
import {interval, Subscription, timer} from 'rxjs';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-torrents-list',
  templateUrl: './torrents-list.component.html',
  styleUrls: ['./torrents-list.component.scss'],
})
export class TorrentsListComponent implements OnInit, OnDestroy {

  @Input('list')
  list: any[] = [];

  @Input('formValues')
  formValues: any;

  @Input()
  set loading(value: boolean) {
    this._setLoading(value);
  }

  get loading(): boolean {
    return this._loading;
  }

  private _loading: boolean = true;
  private _timerSub: Subscription;

  noResults: boolean = true;

  private _sub: Subscription;
  private _intervalSub: Subscription;
  history = [];

  constructor(private userService: UserService,
              private videoSearch: VideoSearchService,
              private router: Router) {
  }

  ngOnInit() {
    this.userService.getHistoryKeys()
      .subscribe(history => this.history = history);
    this._intervalSub = interval(1000).subscribe(() => {
      this.list = this.order(this.list);
    });
  }

  ngOnDestroy() {
    if (this._sub) {
      this._sub.unsubscribe();
      this._sub = null;
    }
    if (this._intervalSub) {
      this._intervalSub.unsubscribe();
      this._intervalSub = null;
    }
  }

  private _setLoading(value: boolean) {
    if (this._timerSub) {
      this._timerSub.unsubscribe();
    }
    this.noResults = false;
    this._loading = value;
    if (!this.list.length) {
      this._loading = true;
    }
    this._timerSub = timer(3000)
      .subscribe(() => {
        if (this.list.length === 0) {
          this.noResults = true;
          return this._loading = true;
        }
        this._loading = value;
      });
  }

  openTorrent(torrent) {
    this.videoSearch.initTorrent(torrent)
      .subscribe(infoHash => {
        this.router.navigate(['torrents', 'player', infoHash])
          .catch(error => console.warn(error));
      });
  }

  order(value: any[]) {
    if (!this.formValues) {
      return value;
    }
    return value.filter(o => {
      if (!o) {
        return false;
      }
      const year = o.omdb && o.omdb.Year ? o.omdb.Year : (parseInt(o.year, 10) || null);
      return !year || (year >= this.formValues.rangeYear[0] && year <= this.formValues.rangeYear[1]);
    })
      .sort((a, b) => {
        const o = this.formValues.order;
        if (o === 'Year') {
          const ay = a.omdb && a.omdb.Year ? a.omdb.Year : (parseInt(a.year, 10) || null);
          const by = b.omdb && b.omdb.Year ? b.omdb.Year : (parseInt(b.year, 10) || null);
          return ay > by ? 1 : -1;
        }

        if (!a.omdb) {
          const title = b.omdb && b.omdb.Title ? b.omdb.Title : (b.title || '');
          return a.title > title ? 1 : -1;
        }
        if (!b.omdb) {
          const title = a.omdb && a.omdb.Title ? a.omdb.Title : (a.title || '');
          return b.title < title ? 1 : -1;
        }

        if (a.omdb[o] === b.omdb[o]) {
          return a.omdb.Title > b.omdb.Title ? 1 : -1;
        }

        return a.omdb[o] > b.omdb[o] ? 1 : -1;
      });
  }

}
