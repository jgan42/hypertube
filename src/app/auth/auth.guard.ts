import {Injectable} from '@angular/core';
import {CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';

import {Observable} from 'rxjs/index';
import {map} from 'rxjs/operators';
import {AuthService} from './auth.service';
import {tap} from 'rxjs/internal/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService,
              private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<any> {
    return this.authService.getCurrentAuth()
      .pipe(
        map(auth => !!auth),
        tap(canActivate => canActivate ? '' : this.router.navigate(['authentication', 'sign-in'])),
      );
  }

  canActivateChild(next: ActivatedRouteSnapshot,
                   state: RouterStateSnapshot): Observable<any> {
    return this.canActivate(next, state);
  }
}
