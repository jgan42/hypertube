import {Injectable} from '@angular/core';

import {BehaviorSubject, Observable} from 'rxjs/index';
import {switchMap, map, tap} from 'rxjs/operators';

import {User} from '../interfaces/user';
import {AuthService} from '../auth/auth.service';
import {AngularFireWrapper} from './angularfire-wrapper.service';
import {PictureService} from './picture.service';
import * as firebase from 'firebase';
import {first} from 'rxjs/internal/operators';
import {VideoSearchService} from './video-search.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _user: BehaviorSubject<User> = new BehaviorSubject(null);
  private _provider: string = '';

  constructor(private authService: AuthService,
              private afW: AngularFireWrapper,
              private pictureService: PictureService,
              private videoSearch: VideoSearchService) {
  }

  get user() {
    return this._user;
  }

  get provider() {
    return this._provider;
  }

  public signIn(email: string, password: string) {
    return this.authService.signIn(email, password);
  }

  public signUp(user: any): Promise<void> {
    return this.authService.signUp(user.email, user.password)
      .then(createdUser => {
        user.key = createdUser.user.uid;
        return this.pictureService.uploadFile(user.picture, user.key);
      })
      .then(downloadURL => this.registerUser(user, downloadURL));
  }

  public getLogin$(uid: string): Observable<string> {
    return this.afW.object('users/' + uid + '/login')
      .value$();
  }

  public getCurrentUser(): Observable<any> {
    return this.authService.getCurrentAuth()
      .pipe(
        tap(authUser => this.setCurrentProvider(authUser)),
        // tap(authUser => console.log(authUser)),
        map(auth => auth ? auth.uid : null),
        switchMap(uid => this.getObjectUser(uid)
          .valueWithKey$()),
        tap(user => this._user.next(user)),
      );
  }

  public signOut(): Promise<any> {
    return this.authService.signOut();
  }

  public resetPassword(email: string): Promise<any> {
    return this.authService.resetPassword(email);
  }

  public getObjectUser(uid) {
    return this.afW.object(`/users/${uid}`);
  }

  public updateProfile(data) {
    return this.authService.getCurrentAuthSync()
      .updateProfile({
        photoURL: data.profileUrl,
        displayName: data.login,
      })
      .then(() => data.picture ? this.pictureService.uploadFile(data.picture, this.user.value.key) : null)
      .then(picUrl => {
        delete data.picture;
        return this.getObjectUser(this._user.value.key)
          .update({
            ...data,
            picture_url: picUrl || data.picture_url,
          });
      });
  }

  public updateEmail(email: string, password: string) {
    const credential = firebase.auth.EmailAuthProvider.credential(this.user.value.email, password);

    return this.authService.getCurrentAuthSync()
      .reauthenticateAndRetrieveDataWithCredential(credential)
      .then(() => this.authService.getCurrentAuthSync().updateEmail(email))
      .then(() => this.getObjectUser(this._user.value.key).update({email}));
  }

  public updatePassword(pwd: string, old: string) {
    const credential = firebase.auth.EmailAuthProvider.credential(this.user.value.email, old);

    return this.authService.getCurrentAuthSync().reauthenticateAndRetrieveDataWithCredential(credential)
      .then(() => this.authService.getCurrentAuthSync().updatePassword(pwd));
  }

  public updateSubtitles(uid: string, styles: string) {
    this.afW.object(`/users/${uid}/subtitles_styles`)
      .set(styles || null)
      .catch(error => console.warn(error));
  }

  public getHistoryKeys() {
    return this.user.pipe(
      first(user => !!user),
      map(user => user.key),
      switchMap(uid => this.afW.list(`/user_histories/${uid}`)
        .keys$()),
    );
  }

  public getHistory() {
    return this.user.pipe(
      first(user => !!user),
      map(user => user.key),
      switchMap(uid => this.afW.list(`/user_histories/${uid}`,
        ref => ref.orderByValue())
        .keys$()),
      map(results => results.reverse()),
      tap(results => results.forEach((key, i) => this.videoSearch.getScrapRef(key)
        .valueWithKey$()
        .pipe(first())
        .subscribe(scrap => results[i] = scrap,
          err => console.warn('err', err)))),
    );
  }

  public putHistory(uid: string, infoHash: string) {
    this.afW.object(`/user_histories/${uid}/${infoHash}`)
      .set(firebase.database.ServerValue.TIMESTAMP)
      .catch(error => console.warn(error));
  }

  private registerUser(user: User, downloadURL: string): Promise<void> {
    return this.getObjectUser(user.key)
      .set({
        first_name: user.first_name,
        last_name: user.last_name,
        login: user.login,
        email: user.email,
        picture_url: downloadURL,
        language: user.language,
      });
  }

  private setCurrentProvider(authUser) {
    const providerData = authUser ? authUser.providerData : [];
    if (providerData.length && providerData[0].providerId === 'password') {
      this._provider = 'password';
    }
  }

}
