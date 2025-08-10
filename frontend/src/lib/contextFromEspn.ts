// src/lib/contextFromEspn.ts
import { espn } from './dataSources';

export type PlayContext = {
  sport: string; league: string; eventId: string;
  down: number|null; distance: number|null; yardline: number|null;
  quarter: number|null; clock_secs: number|null;
  score_diff: number; recent_gains: number[]; recent_clock: number[];
};

function parseClockToSecs(clock: string|null): number|null {
  if (!clock) return null;
  if (clock.includes(':')) {
    const [mm, ss] = clock.split(':').map(x=>parseInt(x||'0',10));
    if (Number.isFinite(mm) && Number.isFinite(ss)) return mm*60+ss;
  }
  const m = clock.match(/^(\d+)(?:'\+(\d+))?/);
  if (m) {
    const base = parseInt(m[1]||'0',10);
    const extra = parseInt(m[2]||'0',10);
    return (base+extra) * 60;
  }
  return null;
}

export async function fetchContext(sport: string, league: string, eventId: string): Promise<PlayContext|null> {
  try {
    const s = await fetch(espn.summary(sport, league, eventId)).then(r=>r.json());
    const comp = s?.header?.competitions?.[0];
    const q = comp?.status?.period ?? null;
    const dc = String(comp?.status?.displayClock || "");
    const clock_secs = parseClockToSecs(dc);
    const home = comp?.competitors?.find((c:any)=>c.homeAway==='home');
    const away = comp?.competitors?.find((c:any)=>c.homeAway==='away');
    const score_diff = (Number(home?.score)||0) - (Number(away?.score)||0);

    const p = await fetch(espn.plays(sport, league, eventId)).then(r=>r.json());
    const items = p?.items || [];
    const last = items[items.length-1];

    const down = sport === 'football' ? (last?.start?.down ?? null) : null;
    const distance = sport === 'football' ? (last?.start?.distance ?? null) : null;
    const yard = sport === 'football' ? (last?.start?.yardLine ?? null) : null;

    const recent = items.slice(-6);
    const recent_gains = recent.map((pl:any)=> Number(pl?.statYardage)||0);
    const recent_clock = recent.map((pl:any)=> {
      const dv = String(pl?.clock?.displayValue || '');
      const secs = parseClockToSecs(dv);
      return secs ?? 0;
    });

    return {
      sport, league, eventId,
      down: Number.isFinite(down) ? Number(down) : null,
      distance: Number.isFinite(distance) ? Number(distance) : null,
      yardline: Number.isFinite(yard) ? Number(yard) : null,
      quarter: q, clock_secs, score_diff,
      recent_gains, recent_clock
    };
  } catch (e) { console.error('fetchContext error', e); return null; }
}
