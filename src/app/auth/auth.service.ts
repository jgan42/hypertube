import {Inject, Injectable} from '@angular/core';

import {Observable} from 'rxjs/index';
import {AngularFireAuth} from 'angularfire2/auth';
import {auth} from 'firebase';
import {AngularFireWrapper} from '../services/angularfire-wrapper.service';
import {map, switchMap, take, tap} from 'rxjs/internal/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {DOCUMENT} from '@angular/common';
import {httpFactory} from '@angular/http/src/http_module';
import {User} from '../interfaces/user';
import {fromPromise} from 'rxjs/internal/observable/fromPromise';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth,
              private afW: AngularFireWrapper,
              private http: HttpClient,
              @Inject(DOCUMENT) private document: any) {
  }

  public signUp(email: string, password: string): Promise<any> {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
  }

  public signIn(email: string, password: string): Promise<any> {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  public getCurrentAuth(): Observable<any> {
    return this.afAuth.authState;
  }

  public signOut(): Promise<any> {
    return this.afAuth.auth.signOut();
  }

  resetPassword(email: string): Promise<any> {
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }

  public signWithGoogle(): Promise<any> {
    return this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider())
      .then((authUser) => {
        const uid = authUser.user.uid;
        const user: any = authUser.additionalUserInfo.profile;
        const userRef = this.afW.object(`/users/${uid}`);

        userRef.value$()
          .pipe(take(1))
          .subscribe((obj) => {
              if (!obj) {
                this.afW.object(`/users/${uid}`)
                  .set({
                    first_name: user.given_name || '',
                    last_name: user.family_name || '',
                    login: user.email.split('@')[0] || '',
                    email: user.email,
                    picture_url: user.picture,
                    language: 'en',
                  })
                  .catch((err) => console.log(err));
              }
            },
            err => console.warn('err', err));
      });
  }

  public signWith42() {
    this.document.location.href = environment.server.host + '/auth/42/redirect';
  }

  public getFireToken(code) {
    let userObj;
    let userId;
    this.http.get(environment.server.host + '/auth/42/handle', {params: {code}})
      .pipe(
        tap((body: { user: User }) => userObj = body.user),
        switchMap((body: { fireToken: string }) => this.afAuth.auth.signInWithCustomToken(body.fireToken)),
        map(authUser => authUser.user.uid),
        tap(uid => userId = uid),
        switchMap(uid => this.afW.object(`/users/${uid}`)
          .value$()),
      )
      .subscribe((obj) => {
        if (!obj) {
          userObj.language = 'en';
          this.afW.object(`/users/${userId}`)
            .set(userObj)
            .catch((err) => console.log(err));
        }
      }, err => console.warn('err', err));
  }

  public getCurrentAuthSync() {
    return this.afAuth.auth.currentUser;
  }
}
