// scripts/build_contexts.mjs
// Lê docs/games.json e cria docs/context/<eventId>.json para cada jogo (server-side, sem CORS).
import fs from "fs/promises";
import path from "path";

const RAW_GAMES = "docs/games.json";
const OUT_DIR = "docs/context";

function toSecs(clock) {
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

function espnSummary(sport, league, eventId) {
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
}
function espnPlays(sport, league, eventId) {
  return `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/events/${eventId}/competitions/${eventId}/plays?limit=300`;
}

const gamesRaw = JSON.parse(await fs.readFile(RAW_GAMES, "utf8"));
const games = gamesRaw.games || [];
await fs.mkdir(OUT_DIR, { recursive: true });

let ok = 0, fail = 0;

for (const g of games) {
  const { sport, league, id: eventId } = g;
  try {
    const s = await fetch(espnSummary(sport, league, eventId), { headers: { "user-agent": "Mozilla/5.0" } }).then(r=>r.json());
    const comp = s?.header?.competitions?.[0];
    const q = comp?.status?.period ?? null;
    const dc = String(comp?.status?.displayClock || "");
    const clock_secs = toSecs(dc);
    const home = comp?.competitors?.find(c=>c.homeAway==='home');
    const away = comp?.competitors?.find(c=>c.homeAway==='away');
    const score_diff = (Number(home?.score)||0) - (Number(away?.score)||0);

    const p = await fetch(espnPlays(sport, league, eventId), { headers: { "user-agent": "Mozilla/5.0" } }).then(r=>r.json());
    const items = p?.items || [];
    const last = items[items.length-1];

    const down = sport === 'football' ? (last?.start?.down ?? null) : null;
    const distance = sport === 'football' ? (last?.start?.distance ?? null) : null;
    const yard = sport === 'football' ? (last?.start?.yardLine ?? null) : null;

    const recent = items.slice(-6);
    const recent_gains = recent.map(pl=> Number(pl?.statYardage)||0);
    const recent_clock = recent.map(pl=> {
      const dv = String(pl?.clock?.displayValue || '');
      const secs = toSecs(dv);
      return secs ?? 0;
    });

    const out = {
      ts: new Date().toISOString(),
      sport, league, eventId,
      context: {
        down, distance, yardline: yard, quarter: q, clock_secs, score_diff,
        recent_gains, recent_clock
      }
    };
    const fp = path.join(OUT_DIR, `${eventId}.json`);
    await fs.writeFile(fp, JSON.stringify(out, null, 2));
    ok++;
  } catch (e) {
    console.error("build_context error for", sport, league, eventId, e);
    fail++;
  }
}

console.log("contexts ok:", ok, "fail:", fail);
