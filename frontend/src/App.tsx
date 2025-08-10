// PATCH para App.tsx — adiciona seleção de Jogo + Estatística e usa contexto ESPN
// Requer: src/lib/dataSources.ts, src/lib/contextFromEspn.ts, src/lib/onnx_infer.ts
import { useEffect, useState } from 'react';
import { GAMES_URL } from './lib/dataSources';
import { fetchContext } from './lib/contextFromEspn';
import { predictNextPlayONNX as predictNextPlay } from './lib/onnx_infer'

const STATS = [
  { id: 'next_play', name: 'Próxima jogada (Run vs Pass)' },
  { id: 'win_prob',  name: 'Win Probability (baseline)' }
];

type Game = { id: string; shortName: string; teams?: any[] };

function winProb(score_diff:number, quarter:number|null, clock_secs:number|null){
  const q = quarter ?? 1, t = clock_secs ?? 900;
  const timeLeft = (4-q)*900 + t;
  const x = 0.06*score_diff - 0.0005*timeLeft; // baseline simples
  const pHome = 1/(1+Math.exp(-x));
  return { run: 1-pHome, pass: pHome };
}

export default function AppPatched() {
  const [games, setGames] = useState<Game[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [stat, setStat] = useState<string>('next_play');
  const [probs, setProbs] = useState<{run:number, pass:number}|null>(null);

  async function loadGames() {
    const j = await fetch(GAMES_URL + `?_=${Date.now()}`).then(r=>r.json());
    setGames(j?.games || []);
    if (!eventId && j?.games?.length) setEventId(j.games[0].id);
  }

  async function refresh() {
    if (!eventId) return;
    const ctx = await fetchContext(eventId);
    if (!ctx) return;
    if (stat === 'win_prob') {
      setProbs(winProb(ctx.score_diff, ctx.quarter, ctx.clock_secs));
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

  useEffect(()=>{ loadGames(); }, []);
  useEffect(()=>{
    refresh(); const id = setInterval(refresh, 8000);
    return ()=>clearInterval(id);
  }, [eventId, stat]);

  return (
    <div style={{maxWidth:920, margin:'0 auto', padding:16, color:'white', fontFamily:'system-ui'}}>
      <h1 style={{margin:'4px 0'}}>RallyIQ</h1>
      <p style={{margin:'0 0 10px', opacity:.8}}>Escolha um jogo e a estatística</p>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
        <select value={eventId} onChange={e=>setEventId(e.target.value)}>
          {games.map(g=>(
            <option key={g.id} value={g.id}>
              {g.shortName} {g.teams?.[0]?.score ?? ''}-{g.teams?.[1]?.score ?? ''}
            </option>
          ))}
        </select>

        <select value={stat} onChange={e=>setStat(e.target.value)}>
          {STATS.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{background:'#0B0F19', borderRadius:16, padding:16, boxShadow:'0 6px 20px rgba(0,0,0,.2)'}}>
        <h3 style={{marginTop:0}}>{STATS.find(s=>s.id===stat)?.name}</h3>
        {probs
          ? <p>Prob. Corrida: {(probs.run*100).toFixed(1)}% • Prob. Passe: {(probs.pass*100).toFixed(1)}%</p>
          : <p>Carregando…</p>
        }
        <small style={{opacity:.7}}>Fonte: ESPN (não-oficial) + modelo local</small>
      </div>
    </div>
  )
}
