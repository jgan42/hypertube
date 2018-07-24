import {Injectable} from '@angular/core';

import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root',
})
export class PictureService {
  private storageRef = firebase.storage().ref('/users');

  constructor() {
  }

  public uploadFile(file: File, uid: string): Promise<any> {
    return new Promise((resolve, reject) => {

      const uploadTask = this.storageRef.child(uid).put(file);
      uploadTask.on('state_changed', () => {
        // handle progression
      }, error => {
        // Handle unsuccessful uploads
        reject(error);
      }, () => {
        // Handle successful uploads on complete
        uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => resolve(downloadURL));
      });
    });
  }
}

