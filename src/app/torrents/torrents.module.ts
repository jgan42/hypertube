import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {torrentsRoutes} from './torrents.routes';
import {RouterModule} from '@angular/router';
import {PlayerModule} from './player/player.module';
import {SearchComponent} from './search/search.component';
import {ComponentsModule} from '../components/components.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NouisliderModule} from 'ng2-nouislider';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(torrentsRoutes),
    PlayerModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    NouisliderModule,
  ],
  declarations: [
    SearchComponent,
  ],
})
export class TorrentsModule {
}
