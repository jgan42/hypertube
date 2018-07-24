import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {VideoSearchService} from '../../services/video-search.service';

@Component({
  selector: 'app-custom-form',
  templateUrl: './custom-form.component.html',
  styleUrls: ['./custom-form.component.scss'],
})
export class CustomFormComponent {

  public formCustom: FormGroup;

  constructor(private fb: FormBuilder,
              private router: Router,
              private videoSearch: VideoSearchService) {

    this.formCustom = this.fb.group({
      magnetOrLink: ['', Validators.required],
    });
  }

  onSubmitCustom() {
    const torrent = this.formCustom.get('magnetOrLink').value;
    if (torrent) {
      this.videoSearch.initTorrent({torrent})
        .subscribe(infoHash => {
          this.router.navigate(['torrents', 'player', infoHash])
            .catch(error => console.warn(error));
        }, error => console.warn(error));
    }
  }
}
