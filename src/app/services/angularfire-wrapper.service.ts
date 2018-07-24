import {Injectable} from '@angular/core';

import {AngularFireDatabase, PathReference, QueryFn, SnapshotAction} from 'angularfire2/database';
import * as firebase from 'firebase';
import {map} from 'rxjs/operators';

import {AngularFireWrapperList, AngularFireWrapperObject} from '../interfaces/angularfire-wrapper';

@Injectable({
  providedIn: 'root'
})
export class AngularFireWrapper {

  constructor(private afDb: AngularFireDatabase) {
  }

  static get time() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  object(refOrPath: PathReference): AngularFireWrapperObject<any> {
    return this.buildWrapperObject(this.afDb.object(refOrPath));
  }

  list(refOrPath: PathReference, queryFn?: QueryFn): AngularFireWrapperList<any> {
    return this.buildWrapperList(this.afDb.list(refOrPath, queryFn));
  }

  private buildWrapperObject(afObject): AngularFireWrapperObject<any> {
    afObject.value$ = afObject.valueChanges;

    afObject.valueWithKey$ = () => afObject.snapshotChanges()
      .pipe(
        map((snap: SnapshotAction<any>) => {
          let val = snap.payload.val();

          if (!val) {
            return null;
          }
          if (typeof val !== 'object') {
            val = {value: val};
          }
          return {key: snap.key, ...val};
        }),
      );

    return afObject;
  }

  private buildWrapperList(afList): AngularFireWrapperList<any> {
    afList.values$ = afList.valueChanges;

    afList.keys$ = () => afList.snapshotChanges()
      .pipe(
        map((snapArray: SnapshotAction<any>[]) => snapArray.map(snap => snap.key)),
      );

    afList.toObject$ = () => afList.snapshotChanges()
      .pipe(
        map((snapArray: SnapshotAction<any>[]) => {
          const object = {};
          snapArray.forEach(snap => object[snap.key] = snap.payload.val());
          return object;
        }),
      );

    return afList;
  }
}
