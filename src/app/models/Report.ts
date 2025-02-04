import { LastFMUserGetRecentTracksResponse } from './lastfm';

export interface Report {
  username: string;
  scrobbles: LastFMUserGetRecentTracksResponse;
}
