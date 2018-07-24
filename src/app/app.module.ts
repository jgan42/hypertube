import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {NgModule} from '@angular/core';

import {AngularFireModule} from 'angularfire2';

import {environment} from '../environments/environment';

import {appRoutes} from './app.routes';
import {AppComponent} from './app.component';
import {ComponentsModule} from './components/components.module';

import {HomeModule} from './home/home.module';
import {AuthModule} from './auth/auth.module';
import {HttpClientModule} from '@angular/common/http';
import {TorrentsModule} from './torrents/torrents.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AuthModule,
    ComponentsModule,
    HomeModule,
    TorrentsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
}
