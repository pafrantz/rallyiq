// src/lib/dataSources.ts
export const RAW_BASE = 'https://raw.githubusercontent.com/pafrantz/rallyiq/main/docs/';
export const GAMES_URL = RAW_BASE + 'games.json';
export const LIVE_URL  = RAW_BASE + 'live.json';

export const espn = {
  summary: (sport: string, league: string, eventId: string) =>
    `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`,
  plays:   (sport: string, league: string, eventId: string) =>
    `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/events/${eventId}/competitions/${eventId}/plays?limit=300`,
};
