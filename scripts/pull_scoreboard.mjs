// scripts/pull_scoreboard.mjs
import fs from "fs/promises";

const URLS = [
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
];
const toClock = (s) => (s && (s.includes(":") || s.includes("'")) ? s : null);
function statusInfo(e) {
  const t = e?.competitions?.[0]?.status?.type || {};
  const name = String(t.name || "").toUpperCase();
  const state = String(t.state || "").toUpperCase();
  const completed = !!t.completed;
  return { name, state, completed };
}
function pickEvent(e) {
  const id = e?.id;
  const comp = e?.competitions?.[0];
  const status = String(comp?.status?.type?.name || "").toUpperCase();
  const quarter = comp?.status?.period ?? null;
  const displayClock = comp?.status?.displayClock ?? null;
  return {
    ts: new Date().toISOString(),
    game_id: id ?? "ESPN",
    quarter,
    clock: toClock(displayClock),
    down: null,
    distance: null,
    yardline: null,
    note: status || "SCHEDULED",
  };
}
let chosen = null;
for (const url of URLS) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) continue;
    const data = await res.json();
    const evs = (data?.events || []).filter(e => {
      const s = statusInfo(e);
      if (s.completed) return false;
      if (s.state === "PRE" || s.state === "IN") return true;
      if (["STATUS_SCHEDULED","STATUS_IN_PROGRESS","STATUS_DELAYED","STATUS_HALFTIME"].includes(s.name)) return true;
      return false;
    });
    if (evs[0]) { chosen = evs[0]; break; }
  } catch (e) { console.error("scoreboard error", url, e); }
}
const first = chosen ? pickEvent(chosen) : {
  ts: new Date().toISOString(),
  game_id: "NONE",
  quarter: 1,
  clock: "00:00",
  down: 1,
  distance: 10,
  yardline: 25,
  note: "Sem jogos ativos/pendentes",
};
await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/live.json", JSON.stringify(first, null, 2));
console.log("docs/live.json atualizado:", first);
