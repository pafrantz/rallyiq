// src/lib/contextFromEspn.ts
import { espn } from './dataSources';

export type PlayContext = {
  down: number|null; distance: number|null; yardline: number|null;
  quarter: number|null; clock_secs: number|null;
  score_diff: number;
  recent_gains: number[]; recent_clock: number[];
};

export async function fetchContext(eventId: string): Promise<PlayContext|null> {
  try {
    const s = await fetch(espn.summary(eventId)).then(r=>r.json());
    const comp = s?.header?.competitions?.[0];
    const q = comp?.status?.period ?? null;
    const dc = comp?.status?.displayClock || "0:00";
    const [mm, ss] = dc.split(':').map((x:string)=>parseInt(x||'0',10));
    const clock_secs = Number.isFinite(mm) && Number.isFinite(ss) ? (mm*60+ss) : null;
    const home = comp?.competitors?.find((c:any)=>c.homeAway==='home');
    const away = comp?.competitors?.find((c:any)=>c.homeAway==='away');
    const score_diff = (Number(home?.score)||0) - (Number(away?.score)||0);

    const p = await fetch(espn.plays(eventId)).then(r=>r.json());
    const items = p?.items || [];
    const last = items[items.length-1];

    const down = last?.start?.down ?? null;
    const distance = last?.start?.distance ?? null;
    const yard = last?.start?.yardLine ?? null;

    const recent = items.slice(-6);
    const recent_gains = recent.map((pl:any)=> Number(pl?.statYardage)||0);
    const recent_clock = recent.map((pl:any)=> {
      const dv = pl?.clock?.displayValue || '0:00';
      const [m, s2] = dv.split(':').map((x:string)=>parseInt(x||'0',10));
      return (Number.isFinite(m)&&Number.isFinite(s2)) ? (m*60+s2) : 0;
    });

    return {
      down: Number.isFinite(down) ? Number(down) : null,
      distance: Number.isFinite(distance) ? Number(distance) : null,
      yardline: Number.isFinite(yard) ? Number(yard) : null,
      quarter: q, clock_secs,
      score_diff,
      recent_gains, recent_clock
    };
  } catch (e) {
    console.error('fetchContext error', e);
    return null;
  }
}
