import {Component, OnInit} from '@angular/core';
import {ScrapperService} from '../services/scrapper.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  public providers: string[] = environment.torrentsProviders;
  public activeTab: string = this.providers[0];
  public torrentList: any[] = [];
  public loading: boolean = false;

  constructor(private scrapService: ScrapperService) {
  }

  ngOnInit() {
    this.getList();
  }

  getList() {
    this.loading = true;
    this.scrapService.index(this.activeTab)
      .subscribe(list => {
          this.torrentList = list;
          this.loading = false;
        }, err => console.warn('err', err),
      );
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.torrentList = [];
    if (tab !== 'custom') {
      this.getList();
    }
  }

}
