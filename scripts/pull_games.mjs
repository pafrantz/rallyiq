// scripts/pull_games.mjs
import fs from "fs/promises";

const LEAGUES = [
  { sport: "football", league: "nfl",     url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" },
  { sport: "soccer",   league: "bra.1",   url: "https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard" },
  { sport: "soccer",   league: "eng.1",   url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" },
];
function statusInfo(event) {
  const t = event?.competitions?.[0]?.status?.type || {};
  const name = String(t.name || "").toUpperCase();
  const state = String(t.state || "").toUpperCase();
  const completed = !!t.completed;
  return { name, state, completed };
}
function slimEvent(event, sport, league) {
  const comp = event?.competitions?.[0];
  const st = statusInfo(event);
  const teams = comp?.competitors?.map(c => ({
    id: c?.id, homeAway: c?.homeAway,
    abbreviation: c?.team?.abbreviation,
    displayName: c?.team?.displayName,
    score: c?.score ? Number(c.score) : null,
  })) || [];
  return {
    sport, league,
    id: event?.id,
    shortName: event?.shortName,
    status: st.name,
    state: st.state,
    period: comp?.status?.period ?? null,
    clock: comp?.status?.displayClock ?? null,
    start: event?.date,
    teams,
  };
}
async function fetchScoreboard({sport, league, url}) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Fetch failed for ${sport}/${league}: ${res.status}`);
  const data = await res.json();
  const events = data?.events || [];
  const filtered = events.filter(e => {
    const s = statusInfo(e);
    if (s.completed) return false;
    if (s.state === "PRE" || s.state === "IN") return true;
    if (["STATUS_SCHEDULED","STATUS_IN_PROGRESS","STATUS_DELAYED","STATUS_HALFTIME"].includes(s.name)) return true;
    return false;
  });
  return filtered.map(ev => slimEvent(ev, sport, league));
}
const all = [];
for (const L of LEAGUES) {
  try { const arr = await fetchScoreboard(L); all.push(...arr); }
  catch (e) { console.error("Erro em", L, e); }
}
all.sort((a,b)=> String(a.start).localeCompare(String(b.start)));
await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/games.json", JSON.stringify({ ts: new Date().toISOString(), games: all }, null, 2));
console.log("docs/games.json atualizado com", all.length, "jogo(s) de múltiplas ligas.");
