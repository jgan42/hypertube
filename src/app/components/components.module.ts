import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NavbarComponent} from './navbar/navbar.component';
import {RouterModule} from '@angular/router';
import {MessageErrorComponent} from './message-error/message-error.component';
import {SearchBarComponent} from './search-bar/search-bar.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TorrentsListComponent} from './torrents-list/torrents-list.component';
import {CustomFormComponent} from './custom-form/custom-form.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    NavbarComponent,
    MessageErrorComponent,
    SearchBarComponent,
    TorrentsListComponent,
    CustomFormComponent,
  ],
  exports: [
    NavbarComponent,
    MessageErrorComponent,
    TorrentsListComponent,
    CustomFormComponent,
  ],
})
export class ComponentsModule {
}
