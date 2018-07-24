import {Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {environment} from '../../../environments/environment';
import {ScrapperService} from '../../services/scrapper.service';
import {startWith, switchMap, tap} from 'rxjs/internal/operators';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {

  public page$: BehaviorSubject<number> = new BehaviorSubject(1);
  public query: string;
  public providers: string[] = environment.torrentsProviders;
  public activeTab: string = this.providers[0];
  public torrentList: any[] = [];
  public scrollEvent;
  public sortedList: any[] = [];
  public loading: boolean = false;
  public form: FormGroup;
  public configRangeYear: any = {
    range: {
      min: 1900,
      max: 2018,
    },
    behaviour: 'drag',
    connect: true,
    step: 5,
    tooltips: [true, true],
    start: [1900, 2018],
  };

  private ready = 0;
  private sub: Subscription;

  constructor(private activatedRoute: ActivatedRoute,
              private fb: FormBuilder,
              private scrapService: ScrapperService,
              private renderer: Renderer2) {
    this.form = this.fb.group({
      order: 'Title',
      rangeYear: [[1950, 2018]],
    });
  }

  ngOnInit() {
    this.scrollEvent = this.renderer.listen('document', 'scroll', this.onScroll.bind(this));

    this.sub = this.activatedRoute.params.pipe(
      tap(params => this.page$.next(1)),
      tap(params => this.query = decodeURIComponent(params.query)),
      tap(() => this.torrentList = []),
      switchMap(() => this.page$),
      tap(() => this.loading = true),
      switchMap(page => this.getList(page)),
      tap((list) => this.ready = list.length ? this.page$.value : this.ready),
      tap(list => this.torrentList = this.torrentList.concat(list)),
      switchMap(() => this.form.valueChanges.pipe(startWith(this.form.value))),
    )
      .subscribe(formValues => {
        this.sortedList = this.torrentList;
        this.loading = false;
      }, err => console.warn('err', err));
  }

  getList(page) {
    return this.scrapService.search(this.query, this.activeTab, page);
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.torrentList = [];
    if (tab === 'custom') {
      return;
    }
    this.page$.next(1);
  }

  onScroll(e) {
    const elem = e.target.scrollingElement;
    if (elem.scrollTop + elem.clientHeight + 50 >= elem.scrollHeight && this.ready === this.page$.value) {
      this.page$.next(this.page$.value + 1);
    }
  }

  ngOnDestroy() {
    this.scrollEvent();
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

}
