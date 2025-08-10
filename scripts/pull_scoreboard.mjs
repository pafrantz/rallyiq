// scripts/pull_scoreboard.mjs
import fs from "fs/promises";

const URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const toClock = (s) => (s && s.includes(":") ? s : null);

function pickEvent(e) {
  const id = e?.id;
  const comp = e?.competitions?.[0];
  const status = comp?.status?.type?.name;
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

const res = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0" } });
if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
const data = await res.json();

const events = data?.events || [];
const first = events[0]
  ? pickEvent(events[0])
  : {
      ts: new Date().toISOString(),
      game_id: "NONE",
      quarter: 1,
      clock: "15:00",
      down: 1,
      distance: 10,
      yardline: 25,
      note: "Sem jogos agora",
    };

await fs.mkdir("docs", { recursive: true });
await fs.writeFile("docs/live.json", JSON.stringify(first, null, 2));
console.log("docs/live.json atualizado:", first);
