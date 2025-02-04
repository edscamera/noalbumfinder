import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  LastFMUserGetInfoResponse,
  LastFMUserGetRecentTracksParams,
  LastFMUserGetRecentTracksResponse,
} from '../models/lastfm';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LastFMService {
  constructor(private http: HttpClient) {}

  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  private buildParams(method: string, params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams({
      fromObject: {
        format: 'json',
        api_key: '',
        method,
      },
    });
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.append(key, value);
    }
    return httpParams;
  }

  public getRecentTracks(
    options: LastFMUserGetRecentTracksParams,
  ): Observable<LastFMUserGetRecentTracksResponse> {
    const params = this.buildParams('user.getrecenttracks', options);
    return this.http.get<LastFMUserGetRecentTracksResponse>(this.baseUrl, {
      params,
    });
  }

  public getUserInfo(username: string): Observable<LastFMUserGetInfoResponse> {
    const params = this.buildParams('user.getinfo', { user: username });
    return this.http.get<LastFMUserGetInfoResponse>(this.baseUrl, { params });
  }

  public getAllScrobbles(
    username: string,
    range: number,
  ): Observable<LastFMUserGetRecentTracksResponse> {
    return this.getUserInfo(username).pipe(
      switchMap((userInfo) => {
        const playcount = Math.min(parseInt(userInfo.user.playcount), range);
        const pages = Math.ceil(playcount / 200);
        const requests = Array.from({ length: pages }, (_, i) =>
          this.getRecentTracks({
            user: username,
            limit: 200,
            page: i + 1,
          }),
        );
        return forkJoin(requests).pipe(
          map((results) => ({
            recenttracks: {
              '@attr': {
                page: '1',
                perPage: playcount.toString(),
                totalPages: '1',
                total: playcount.toString(),
                user: username,
              },
              track: results.map((x) => x.recenttracks.track).flat(),
            },
          })),
        );
      }),
    );
  }
}
