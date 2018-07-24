import {Routes} from '@angular/router';
import {AuthGuard} from '../auth/auth.guard';
import {SettingsComponent} from './settings.component';

export const settingsRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: SettingsComponent
  }
];
