import {Component, ElementRef, OnDestroy, Renderer2, ViewChild, AfterViewInit, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {VideoSearchService} from '../../services/video-search.service';
import {fromEvent, Subscription, timer} from 'rxjs';
import {debounceTime, first, map, switchMap, take, tap} from 'rxjs/internal/operators';
import {ActivatedRoute, Params} from '@angular/router';
import {UserService} from '../../services/user.service';
import {User} from '../../interfaces/user';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('video')
  videoRef: ElementRef;
  @ViewChild('overlay')
  overlayRef: ElementRef;

  video: HTMLVideoElement;
  torrent: { key: string, current_speed: number, files: any[], speed: string, subtitles: string } = null;
  torrentScrap: any = null;
  activeTab: string = 'info';
  active: boolean = false;
  selectedFile: any = null;
  topMessage: string = '';
  infoHash: string = '';
  activeSubtitles: string = '';
  videoErrorRetry = 0;
  user: User = null;

  private _overlaySub: Subscription;
  private _wheelSub: Subscription;
  private _torrentSub: Subscription;
  private _lastSrc: string = '';
  private _overTab: boolean = false;

  constructor(private videoSearch: VideoSearchService,
              private renderer: Renderer2,
              private location: Location,
              private activatedRoute: ActivatedRoute,
              private userService: UserService) {
  }

  ngOnInit() {
    this._torrentSub = this.userService.user.pipe(
      first(user => !!user),
      tap((user: User) => this.user = user),
      switchMap(() => this.activatedRoute.params),
      take(1),
      map((params: Params) => params['infoHash']),
      tap(infoHash => this.infoHash = infoHash),
      tap(infoHash => this.userService.putHistory(this.user.key, infoHash)),
      switchMap(infoHash => this.videoSearch.getScrapRef(infoHash)
        .valueWithKey$()),
      tap(scrap => this.torrentScrap = scrap),
      switchMap(() => this.videoSearch.getTorrent(this.torrentScrap.torrent)),
    )
      .subscribe((torrent: any) => {
        this.torrent = torrent;
        if (torrent && torrent.files && torrent.files.length) {
          this.selectedFile = torrent.files[0];
        }
        if (!torrent || !torrent.files || !this.selectedFile) {
          return;
        }
        this.torrent.speed = Math.floor(torrent.current_speed / 1024) + 'kB/s';
        this.putSrc();
        this.setSubtitles();
      }, err => console.warn('err', err));
  }

  ngAfterViewInit() {
    this.video = this.videoRef.nativeElement;
    this._overlaySub = fromEvent(this.overlayRef.nativeElement, 'mousemove')
      .pipe(tap(() => this.active = true), debounceTime(3000))
      .subscribe(() => this.active = false);
    this._wheelSub = fromEvent(this.overlayRef.nativeElement, 'wheel')
      .pipe(tap((e) => this.mouseWheel(e)), debounceTime(2000))
      .subscribe(() => this.topMessage = '');
  }

  ngOnDestroy() {
    if (this._torrentSub) {
      this._torrentSub.unsubscribe();
      this._torrentSub = null;
    }
    if (this._overlaySub) {
      this._overlaySub.unsubscribe();
      this._overlaySub = null;
    }
    if (this._wheelSub) {
      this._wheelSub.unsubscribe();
      this._wheelSub = null;
    }
  }

  back() {
    this.location.back();
  }

  switchTab(tab: string) {
    this.activeTab = this.activeTab === tab ? '' : tab;
  }

  selectFile(file) {
    this.selectedFile = file;
    this.videoSearch.setStartingOffset(this.torrent.key, file.offset);
    this._lastSrc = '';
    this.putSrc();
  }

  putSrc() {
    const selectedFile = this.torrent.files.find(file => file.name === this.selectedFile.name);
    const fileName = selectedFile.converted || selectedFile.name;
    const src = `http://localhost:8080/stream/${this.torrent.key}/${fileName}`;

    if (selectedFile && selectedFile.ready && src !== this._lastSrc) {
      this._lastSrc = src;
      this.renderer.setAttribute(this.video, 'src', src);
    }
  }

  setSubtitles() {
    if (!this.torrent.subtitles || this.video.textTracks.length) {
      return;
    }
    Object.keys(this.torrent.subtitles)
      .forEach(lang => {
        const track = this.renderer.createElement('track');
        this.renderer.setAttribute(track, 'srclang', lang);
        this.renderer.setAttribute(track, 'src', `http://localhost:8080/subs/${this.infoHash}/${lang}.vtt`);
        this.renderer.appendChild(this.video, track);
      });
    for (let i = 0; i < this.video.textTracks.length; i++) {
      this.video.textTracks[i].mode = 'hidden';
    }
    this.selectSubs(this.user.language || 'en');
    this.renderer.setAttribute(this.video, 'class', this.user.subtitles_styles || '');
  }

  playPause() {
    if (this.activeTab) {
      return;
    }
    if (!this.video.paused) {
      return this.video.pause();
    }
    this.video.play()
      .catch(err => console.warn(err));
  }

  setOverStatus(value: boolean) {
    this._overTab = value;
  }

  mouseWheel(e) {
    if (this._overTab && this.active) {
      return;
    }
    const newVolume = this.video.volume + (e.deltaY > 0 ? -.05 : .05);
    this.video.volume = newVolume < 0 ? 0 : (newVolume > 1 ? 1 : newVolume);
    this.video.muted = !this.video.volume;
    this.topMessage = 'Volume: ' + Math.round(this.video.volume * 100) + '%';
  }

  selectSubs(lang = '') {
    if (!this.torrent.subtitles || (lang && !this.torrent.subtitles[lang])) {
      return this.topMessage = lang + ' subtitles unavailable...';
    }
    for (let i = 0; i < this.video.textTracks.length; i++) {
      const track = this.video.textTracks[i];
      if (track.language === lang) {
        if (track.mode === 'hidden') {
          this.activeSubtitles = lang;
          track.mode = 'showing';
        }
        else {
          this.activeSubtitles = '';
          track.mode = 'hidden';
        }
      }
      else {
        track.mode = 'hidden';
      }
    }
    if (!lang) {
      this.activeSubtitles = '';
    }
  }

  setSubSize(size: string) {
    this.renderer.removeClass(this.video, 'text-small');
    this.renderer.removeClass(this.video, 'text-medium');
    this.renderer.removeClass(this.video, 'text-big');
    this.renderer.addClass(this.video, size);
    this.userService.updateSubtitles(this.user.key, this.video.className);
  }

  toggleSubBg() {
    if (this.video.className.match('no-bg')) {
      return this.renderer.removeClass(this.video, 'no-bg');
    }
    this.renderer.addClass(this.video, 'no-bg');
    this.userService.updateSubtitles(this.user.key, this.video.className);
  }

  handleError() {
    console.log('Error block at time :', this.video.currentTime);
    if (this.video.currentTime === 0) {
      return;
    }
    if (this.videoErrorRetry < 10) {
      this.videoErrorRetry++;
      this.topMessage = 'Loading data ...';
      console.log('retry in', this.videoErrorRetry * 5000);
      const timeOut = this.video.currentTime;
      const currentRetry = this.videoErrorRetry;
      timer(5000)
        .subscribe(() => {
          this._lastSrc = '';
          this.putSrc();
          const listener = this.renderer.listen(this.video, 'loadedmetadata', () => {
            this.video.currentTime = timeOut + this.videoErrorRetry;
            listener();
            this.topMessage = '';
          });
        });
      timer(6000)
        .subscribe(() => {
          if (currentRetry === this.videoErrorRetry) {
            this.videoErrorRetry = 0;
          }
        });
      return;
    }
    this.topMessage = 'Live conversion for Chrome only, please wait full conversion...';
  }

}
