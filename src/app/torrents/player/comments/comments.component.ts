import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import {VideoSearchService} from '../../../services/video-search.service';
import {UserService} from '../../../services/user.service';
import {AngularFireWrapperList} from '../../../interfaces/angularfire-wrapper';
import {AngularFireWrapper} from '../../../services/angularfire-wrapper.service';
import {take} from 'rxjs/internal/operators';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss', '../player.component.scss'],
})
export class CommentsComponent implements AfterViewInit, OnDestroy {

  @Input('infoHash')
  infoHash: string;

  input: string = '';
  comments: any[] = [];
  private _commentsRef: AngularFireWrapperList<any>;
  private _commentsSub: Subscription;

  constructor(private videoSearch: VideoSearchService,
              private userService: UserService) {
  }

  ngAfterViewInit() {
    this._commentsRef = this.videoSearch.getCommentsRef(this.infoHash);
    this._commentsSub = this._commentsRef.values$()
      .subscribe(comments => {
        this.comments = comments;
        comments.map(comment => {
          this.userService.getLogin$(comment.uid)
            .pipe(take(1))
            .subscribe(login => comment['login'] = login);
        });
      });
  }

  postComment() {
    const currentUser = this.userService.user.value;
    const text = this.input;

    if (!this.input) {
      return;
    }
    this.input = '';
    this._commentsRef.push({
      uid: currentUser.key,
      created: AngularFireWrapper.time,
      text,
    });
  }

  setFocus(bool: boolean) {
    this.videoSearch.getInputState().next(bool);
  }

  ngOnDestroy() {
    if (this._commentsSub) {
      this._commentsSub.unsubscribe();
      this._commentsSub = null;
    }
  }

}
