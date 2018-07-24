import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HistoryComponent} from './history.component';
import {historyRoutes} from './history.routes';
import {RouterModule} from '@angular/router';
import {ComponentsModule} from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(historyRoutes),
    ComponentsModule,
  ],
  declarations: [HistoryComponent],
})
export class HistoryModule {
}
