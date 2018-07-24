import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs/index';
import {UserService} from '../../services/user.service';
import {User} from '../../interfaces/user';
import {Router} from '@angular/router';
import {tap} from 'rxjs/internal/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  public user: User = null;

  private subscription: Subscription;

  constructor(private userService: UserService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.subscription = this.userService.getCurrentUser()
      .pipe(tap(user => this.redirect(user)))
      .subscribe(user => this.user = user, err => console.warn('err', err));
  }

  private redirect(user: User) {
    const url: string = this.router.url;
    const notLogged = /^\/authentication/;
    const logged = /^\/(torrents)|(profile)|(settings)|(history)/;
    if ((user && url.match(notLogged)) || (!user && url.match(logged))) {
      this.router.navigate([''])
        .catch(error => console.warn(error));
    }
  }

  public signOut(): void {
    this.userService.signOut()
      .catch(error => console.warn(error));
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
