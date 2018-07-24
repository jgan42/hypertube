import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../auth.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/index';
import {first, map, switchMap} from 'rxjs/internal/operators';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss']
})
export class OauthComponent implements OnInit, OnDestroy {

  private routeSub: Subscription;

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.routeSub = this.route
      .queryParams
      .pipe(
        first(params => params['code']),
        map(params => params['code']),
      )
      .subscribe(code => this.authService.getFireToken(code),
        err => console.warn('err', err));
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
      this.routeSub = null;
    }
  }

  public withGoogle() {
    this.authService.signWithGoogle()
      .catch(error => console.warn(error));
  }

  public with42() {
    this.authService.signWith42();
  }
}
