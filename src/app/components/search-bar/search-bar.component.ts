import {Component} from '@angular/core';
import {ScrapperService} from '../../services/scrapper.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-search-bar',
  templateUrl: 'search-bar.component.html',
  styleUrls: ['search-bar.component.scss']
})
export class SearchBarComponent {

  input: string = '';
  focused: boolean = false;

  constructor(private scrapperService: ScrapperService,
              private router: Router) {
  }

  search() {
    this.router.navigate(['torrents', 'search', encodeURIComponent(this.input)])
      .catch(err => console.log(err));
  }

  onFocus() {
    this.focused = true;
  }
  onBlur() {
    this.focused = false;
  }

}
