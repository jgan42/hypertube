import {Routes} from '@angular/router';

import {ProfileComponent} from './profile.component';
import {AuthGuard} from '../auth/auth.guard';


export const profileRoutes: Routes = [
  {
    path: ':id',
    canActivate: [AuthGuard],
    component: ProfileComponent
  },
  {
    path: '',
    canActivate: [AuthGuard],
    component: ProfileComponent
  },
];
