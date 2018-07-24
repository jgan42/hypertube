import {AngularFireList, AngularFireObject} from 'angularfire2/database';
import {Observable} from 'rxjs';

export interface AngularFireWrapperList<T> extends AngularFireList<T> {
  values$(): Observable<T[]>;
  keys$(): Observable<T[]>;
  toObject$(): Observable<T>;
}

export interface AngularFireWrapperObject<T> extends AngularFireObject<T> {
  value$(): Observable<T | null>;
  valueWithKey$(): Observable<T>;
}
