import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {

  historyList: any[] = [];
  loading: boolean = true;

  private _historySub: Subscription;

  constructor(private userService: UserService) {
  }

  ngOnInit() {
    this.loading = true;
    this._historySub = this.userService.getHistory()
      .subscribe(results => {
        this.historyList = results;
        this.loading = false;
      });
  }

  ngOnDestroy() {
    if (this._historySub) {
      this._historySub.unsubscribe();
      this._historySub = null;
    }
  }

}
