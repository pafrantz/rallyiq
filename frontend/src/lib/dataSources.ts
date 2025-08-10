// src/lib/dataSources.ts
export const RAW_BASE = 'https://raw.githubusercontent.com/pafrantz/rallyiq/main/docs/';
export const GAMES_URL = RAW_BASE + 'games.json';
export const LIVE_URL  = RAW_BASE + 'live.json';

export const espn = {
  summary: (eventId: string) => `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`,
  plays:   (eventId: string) => `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${eventId}/competitions/${eventId}/plays?limit=300`
};
