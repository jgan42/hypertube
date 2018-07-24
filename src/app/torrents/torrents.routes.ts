import {Routes} from '@angular/router';
import {PlayerComponent} from './player/player.component';
import {AuthGuard} from '../auth/auth.guard';
import {SearchComponent} from './search/search.component';

export const torrentsRoutes: Routes = [
  {
    path: 'torrents',
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'search/:query',
        component: SearchComponent,
      },
      {
        path: 'player/:infoHash',
        component: PlayerComponent,
      },
    ],
  },
];
