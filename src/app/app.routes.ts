import {Routes} from '@angular/router';

import {HomeComponent} from './home/home.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'profile',
    loadChildren: './profile/profile.module#ProfileModule'
  },
  {
    path: 'settings',
    loadChildren: './settings/settings.module#SettingsModule'
  },
  {
    path: 'history',
    loadChildren: './history/history.module#HistoryModule'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
];
