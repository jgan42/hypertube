import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable, of} from 'rxjs/index';
import {map, switchMap, take, tap} from 'rxjs/internal/operators';
import {AngularFireWrapper} from './angularfire-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class ScrapperService {

  private top: any = {};

  constructor(private http: HttpClient, private afW: AngularFireWrapper) {

  }

  index(source: string): Observable<any> {
    if (this.top[source]) {
      return of(this.top[source]);
    }
    else {
      return this.http.get(environment.server.host + '/scrap/top', {
        params: {
          source,
        },
      })
        .pipe(
          map((res: { movies: Array<any> }) => res.movies),
          tap((movies) => {
            this.top[source] = movies;
            this.getMoviesDetails(movies, 0);
          }),
        );
    }
  }

  private getMoviesDetails(movies: Array<any>, i) {
    if (!movies[i]) {
      return;
    }

    let params;
    if (movies[i].imdb) {
      params = {
        imdb: movies[i].imdb,
      };
    }
    else {
      params = {
        title: movies[i].title,
      };
    }

    const scrapomdb$ = this.http.get(environment.server.host + '/scrap/omdb', {
      params: params,
    });

    const scrapRef = this.afW.object(`torrent_scraps/${movies[i].infoHash}`);

    scrapRef.value$()
      .pipe(
        take(1),
        switchMap((o: { omdb }) => o && o.omdb && o.omdb.Response === 'True' ? of(o.omdb) : scrapomdb$),
      )
      .subscribe((data) => {
        movies[i].omdb = data;
        scrapRef.set(movies[i])
          .catch(error => console.warn(error));
        if (data && data['Poster'] === 'N/A') {
          movies[i].omdb.Poster = '';
        }
        this.getMoviesDetails(movies, ++i);
      }, err => console.warn('err', err));
  }

  search(query: string, source: string, page: number): Observable<any> {
    return this.http.get(environment.server.host + '/scrap/search', {
      params: {
        query: encodeURIComponent(query),
        source,
        page: page.toString(),
      },
    })
      .pipe(
        map((res: { movies: Array<any> }) => res.movies),
        tap(movies => this.getMoviesDetails(movies, 0)),
      );
  }

}
