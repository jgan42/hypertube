import {Routes} from '@angular/router';
import {AuthGuard} from '../auth/auth.guard';
import {HistoryComponent} from './history.component';

export const historyRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: HistoryComponent,
  },
];
