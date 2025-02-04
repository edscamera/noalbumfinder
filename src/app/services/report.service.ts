import { Injectable } from '@angular/core';
import { Report } from '../models/Report';
import { LastFMService } from './lastfm.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private lastfmService: LastFMService) {}

  public readonly reports: Report[] = [];

  public createReport(username: string, tracks: number): Observable<Report> {
    return this.lastfmService.getAllScrobbles(username, tracks).pipe(
      map((scrobbles) => {
        const report: Report = { username, scrobbles };
        this.reports.push(report);
        return report;
      }),
    );
  }
}
