import {Component, AfterViewInit, Input, Renderer2, Inject, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {VideoSearchService} from '../../../services/video-search.service';
import {Subscription} from 'rxjs/index';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements AfterViewInit, OnDestroy {

  @Input('file')
  file: any = null;
  @Input('video')
  video: HTMLMediaElement;
  isFullScreen: boolean = false;
  changingVolume: any = false;
  inputFocused: boolean = false;

  @ViewChild('volume')
  volumeRef: ElementRef;
  @ViewChild('time')
  timeRef: ElementRef;

  private _inputSub: Subscription;
  private _listeners: any[] = [];
  private _changingTime: any = false;

  constructor(@Inject(DOCUMENT) private document: any,
              private renderer: Renderer2,
              private videoSearch: VideoSearchService) {
  }

  ngAfterViewInit() {
    this._inputSub = this.videoSearch.getInputState().subscribe(val => this.inputFocused = val);
    this._listeners.push(this.renderer.listen(this.video, 'ended', () => null));
    this._listeners.push(this.renderer.listen('document', 'mousemove', this.mouseMove.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'mouseleave', this.mouseUp.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'mouseup', this.mouseUp.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'keypress', this.keyPress.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'dblclick', this.toggleFullScreen.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'fullscreenchange', this.fullScreenChange.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'webkitfullscreenchange', this.fullScreenChange.bind(this)));
    this._listeners.push(this.renderer.listen('document', 'mozfullscreenchange', this.fullScreenChange.bind(this)));
  }

  ngOnDestroy() {
    this._listeners.forEach(listener => listener());
    if (this._inputSub) {
      this._inputSub.unsubscribe();
      this._inputSub = null;
    }
  }

  playPause() {
    if (!this.video.paused) {
      return this.video.pause();
    }
    this.video.play()
      .catch(err => console.warn(err));
  }

  toggleMute() {
    this.video.muted = !this.video.muted;
    this.video.volume = this.video.muted ? 0 : (this.video.volume || 1);
  }

  toggleFullScreen(e) {
    const player = this.video.parentElement;
    if (!this.isFullScreen) {
      if (e && e.y < 50) {
        return;
      }
      if (player.requestFullscreen) {
        return player.requestFullscreen();
      }
      if (player['mozRequestFullScreen']) {
        return player['mozRequestFullScreen']();
      }
      if (player.webkitRequestFullscreen) {
        return player.webkitRequestFullscreen();
      }
      console.warn('No fullscreen available');
    }
    if (this.document['cancelFullscreen']) {
      return this.document['cancelFullscreen']();
    }
    if (this.document['mozCancelFullScreen']) {
      return this.document['mozCancelFullScreen']();
    }
    if (this.document.webkitCancelFullScreen) {
      return this.document.webkitCancelFullScreen();
    }
  }

  fullScreenChange() {
    const player = this.video.parentElement;
    this.isFullScreen = this.document.fullscreenElement
      || this.document.webkitFullscreenElement
      || this.document.mozFullScreenElement;
    this.isFullScreen ? this.renderer.addClass(player, 'fullscreen') : this.renderer.removeClass(player, 'fullscreen');
  }

  volumeMouseDown() {
    this.changingVolume = this.volumeRef.nativeElement.getBoundingClientRect();
  }

  timeMouseDown() {
    this._changingTime = this.timeRef.nativeElement.getBoundingClientRect();
  }

  mouseMove(e) {
    if (this.changingVolume) {
      const newVolume = (this.changingVolume.bottom - e.y) / (this.changingVolume.bottom - this.changingVolume.top);
      this.video.volume = newVolume < 0 ? 0 : (newVolume > 1 ? 1 : newVolume);
      this.video.muted = !this.video.volume;
    }
    if (this._changingTime) {
      const newTime = this.video.duration * (this._changingTime.left - e.x) / (this._changingTime.left - this._changingTime.right);
      this.video.currentTime = (newTime < 0 ? 0 : (newTime > this.video.duration ? this.video.duration : newTime)) || 0;
    }
  }

  mouseUp(e) {
    this.mouseMove(e);
    this._changingTime = false;
    this.changingVolume = false;
  }

  keyPress(e) {
    if ((e.key === ' ' || e.keyCode === 32) && !this.inputFocused) {
      this.playPause();
    }
  }

  buffer(range: string): {left: string, width: string} {
    const split = range.split('-');
    const start = parseInt(split[0], 10);
    const end = parseInt(split[1], 10);
    return {
      width: ((end - start) / this.file.length) * 100 +  '%',
      left: (start / this.file.length) * 100 + '%'
    };
  }

}
