// scripts/pull_games.mjs
import fs from "fs/promises";

const URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

function statusInfo(e) {
  const t = e?.competitions?.[0]?.status?.type || {};
  const name = String(t.name || "").toUpperCase();   // ex: STATUS_FINAL, STATUS_SCHEDULED, STATUS_IN_PROGRESS
  const state = String(t.state || "").toUpperCase(); // ex: PRE, IN, POST
  const completed = !!t.completed;                   // true quando acabou
  return { name, state, completed };
}

function slimEvent(e) {
  const comp = e?.competitions?.[0];
  const { name, state } = statusInfo(e);
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
    status: name,                                 // sempre MAIÚSCULO
    period: comp?.status?.period ?? null,
    clock: comp?.status?.displayClock ?? null,
    state,                                        // PRE / IN / POST
    start: e?.date,
    teams,
  };
}

const res = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0" } });
if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
const data = await res.json();

const events = (data?.events || []);
const filtered = events.filter(e => {
  const s = statusInfo(e);
  // corte duro: se já completou, fora
  if (s.completed) return false;
  // permite pré-jogo e em andamento
  if (s.state === "PRE" || s.state === "IN") return true;
  // fallback por nome (delays/halftime)
  if (["STATUS_SCHEDULED","STATUS_IN_PROGRESS","STATUS_DELAYED","STATUS_HALFTIME"].includes(s.name)) return true;
  // tudo mais (FINAL/POST) fica fora
  return false;
});

const games = filtered.map(slimEvent);

await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/games.json", JSON.stringify({ ts: new Date().toISOString(), games }, null, 2));
console.log("docs/games.json atualizado com", games.length, "jogo(s) ativos/pendentes.");
