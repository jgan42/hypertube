import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../services/user.service';
import {switchMap} from 'rxjs/internal/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {

  public user;
  private sub;

  constructor(private userService: UserService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.sub = this.route.params.pipe(switchMap(params => {
      if (params['id']) {
        return this.userService.getObjectUser(params['id'])
          .valueWithKey$();
      }
      return this.userService.getCurrentUser();
    }))
      .subscribe((user) => this.user = user);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
