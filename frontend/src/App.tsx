// PATCH para App.tsx — NFL + Soccer e logo
import { useEffect, useState } from 'react';
import { GAMES_URL } from './lib/dataSources';
import { fetchContext } from './lib/contextFromEspn';
import { predictNextPlayONNX as predictNextPlay } from './lib/onnx_infer';
import logoUrl from '/public/img/rallyiq-logo.jpg?url';
import { fetchContextRepo } from './lib/fetchContextRepo';

type Game = { sport: string; league: string; id: string; shortName: string; status: string; state: string; teams?: any[] };

// jogo selecionado e rótulos HOME/AWAY
const current = games.find(g => g.id === eventId);
const homeAbbr = current?.teams?.find((t:any)=>t.homeAway==='home')?.abbreviation ?? 'HOME';
const awayAbbr = current?.teams?.find((t:any)=>t.homeAway==='away')?.abbreviation ?? 'AWAY';

// qual estatística vale de fato (soccer força WP)
const statEffective = (sport !== 'football' && stat === 'next_play') ? 'win_prob' : stat;
const isWP = statEffective === 'win_prob';


const STATS = [
  { id: 'next_play', name: 'Próxima jogada (Run vs Pass)', only: 'football' as const },
  { id: 'win_prob',  name: 'Win Probability (baseline)',  only: 'any' as const },
];

function winProb(score_diff:number, quarter:number|null, clock_secs:number|null, sport: string){
  const periods = sport === 'football' ? 4 : 2;
  const periodSeconds = sport === 'football' ? 900 : 45*60;
  const q = quarter ?? 1, t = clock_secs ?? periodSeconds;
  const timeLeft = (periods-q)*periodSeconds + t;
  const x = 0.08*score_diff - 0.0004*timeLeft;
  const pHome = 1/(1+Math.exp(-x));
  return { run: 1-pHome, pass: pHome };
}

export default function AppPatched() {
  const [games, setGames] = useState<Game[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [sport, setSport] = useState<string>('football');
  const [league, setLeague] = useState<string>('nfl');
  const [stat, setStat] = useState<string>('next_play');
  const [probs, setProbs] = useState<{run:number, pass:number}|null>(null);

  async function loadGames() {
    const j = await fetch(GAMES_URL + `?_=${Date.now()}`).then(r=>r.json());
    const arr: Game[] = j?.games || [];
    setGames(arr);
    if (!eventId && arr.length) { setEventId(arr[0].id); setSport(arr[0].sport); setLeague(arr[0].league); }
  }

  useEffect(()=>{ loadGames(); }, []);
  useEffect(()=>{ refresh(); const id = setInterval(refresh, 8000); return ()=>clearInterval(id); }, [eventId, sport, league, stat]);

  async function refresh() {
  if (!eventId) return;
  const ctx = await fetchContextRepo(eventId);
  if (!ctx) { setProbs(null); return; }
  const statToUse = (sport !== 'football' && stat === 'next_play') ? 'win_prob' : stat;
  if (statToUse === 'win_prob') {
    setProbs(winProb(ctx.score_diff, ctx.quarter, ctx.clock_secs, sport));
  } else {
    const p = await predictNextPlay({
      down: ctx.down ?? 1,
      distance: ctx.distance ?? 10,
      yardline: ctx.yardline ?? 50,
      quarter: ctx.quarter ?? 1,
      clock_secs: ctx.clock_secs ?? 900,
      score_diff: ctx.score_diff ?? 0,
      recent_gains: ctx.recent_gains ?? [],
      recent_clock: ctx.recent_clock ?? [],
    });
    setProbs(p);
  }
}

  const leaguesBySport = (s:string) => Array.from(new Set(games.filter(g=>g.sport===s).map(g=>g.league)));
  const filteredGames = games.filter(g=>g.sport===sport && g.league===league);

  return (
    <div style={{maxWidth:980, margin:'0 auto', padding:16, color:'white', fontFamily:'system-ui'}}>
      <header style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
        <img src={logoUrl} alt="RallyIQ" style={{height:72}} />
        <div>
          <h1 style={{margin:'0 0 4px'}}>RallyIQ</h1>
          <div style={{opacity:.8}}>NFL (Próxima jogada) • Soccer (Win Prob.) — MVP</div>
        </div>
      </header>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
        <select value={sport} onChange={(e)=>{ setSport(e.target.value); const ls = leaguesBySport(e.target.value); setLeague(ls[0]||''); }}>
          {['football','soccer'].map(s=> <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>

        <select value={league} onChange={(e)=>setLeague(e.target.value)}>
          {leaguesBySport(sport).map(l=> <option key={l} value={l}>{l}</option>)}
        </select>

        <select value={eventId} onChange={(e)=>setEventId(e.target.value)}>
          {filteredGames.map(g=>(
            <option key={g.id} value={g.id}>
              {g.shortName} {g.teams?.[0]?.score ?? ''}-{g.teams?.[1]?.score ?? ''} ({g.status})
            </option>
          ))}
        </select>

        <select value={stat} onChange={(e)=>setStat(e.target.value)}>
          {STATS.filter(s => s.only==='any' || s.only===sport).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{background:'#0B0F19', borderRadius:16, padding:16, boxShadow:'0 6px 20px rgba(0,0,0,.2)'}}>
  <h3 style={{marginTop:0}}>
    {isWP ? 'Win Probability' : 'Próxima jogada (Run vs Pass)'}
  </h3>

  {probs ? (
    isWP ? (
      // No nosso cálculo atual: probs.pass = WP do mandante (home), probs.run = WP do visitante (away)
      <p>WP {homeAbbr}: {(probs.pass*100).toFixed(1)}% • WP {awayAbbr}: {(probs.run*100).toFixed(1)}%</p>
    ) : (
      <p>Prob. Corrida: {(probs.run*100).toFixed(1)}% • Prob. Passe: {(probs.pass*100).toFixed(1)}%</p>
    )
  ) : (
    <p>Carregando…</p>
  )}

  <small style={{opacity:.7}}>
    {isWP
      ? 'Fonte: ESPN (não-oficial). MVP de Win Probability para soccer.'
      : 'Fonte: ESPN (não-oficial) + modelo/heurística para NFL.'}
  </small>
</div>

    </div>
  )
}

