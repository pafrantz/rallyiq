// scripts/pull_games.mjs
// scripts/pull_games.mjs
import fs from "fs/promises";

const URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const ALLOW = new Set(["STATUS_SCHEDULED","STATUS_IN_PROGRESS","STATUS_DELAYED","STATUS_HALFTIME"]);

function slimEvent(e) {
  const comp = e?.competitions?.[0];
  const status = comp?.status?.type?.name;
  const teams = comp?.competitors?.map(c => ({
    id: c?.id,
    homeAway: c?.homeAway,
    abbreviation: c?.team?.abbreviation,
    displayName: c?.team?.displayName,
    score: c?.score ? Number(c.score) : null,
  })) || [];
  return {
    id: e?.id,
    shortName: e?.shortName,
    status,
    period: comp?.status?.period ?? null,
    clock: comp?.status?.displayClock ?? null,
    start: e?.date,
    teams,
  };
}

const res = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0" } });
if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
const data = await res.json();

const gamesAll = (data?.events || []).map(slimEvent);
const games = gamesAll.filter(g => ALLOW.has(g.status));

await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/games.json", JSON.stringify({ ts: new Date().toISOString(), games }, null, 2));
console.log("docs/games.json atualizado com", games.length, "jogo(s) ativos/pendentes.");
