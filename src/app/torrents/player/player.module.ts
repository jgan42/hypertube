import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlayerComponent} from './player.component';
import {FormsModule} from '@angular/forms';
import {ControlsComponent} from './controls/controls.component';
import {PipesModule} from '../../pipes/pipes.module';
import {CommentsComponent} from './comments/comments.component';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    RouterModule,
  ],
  declarations: [
    PlayerComponent,
    ControlsComponent,
    CommentsComponent,
  ],
  exports: [
    PlayerComponent,
  ],
})
export class PlayerModule {
}
