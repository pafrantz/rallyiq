// src/lib/fetchContextRepo.ts
export const RAW_BASE = 'https://raw.githubusercontent.com/pafrantz/rallyiq/main/docs/context/';
export type RepoContext = {
  ts: string;
  sport: string; league: string; eventId: string;
  context: {
    down: number|null; distance: number|null; yardline: number|null;
    quarter: number|null; clock_secs: number|null;
    score_diff: number; recent_gains: number[]; recent_clock: number[];
  }
};

export async function fetchContextRepo(eventId: string): Promise<RepoContext['context'] | null> {
  try {
    const url = `${RAW_BASE}${eventId}.json?_=${Date.now()}`;
    const j = await fetch(url).then(r=> r.ok ? r.json() : null);
    return j?.context ?? null;
  } catch {
    return null;
  }
}
