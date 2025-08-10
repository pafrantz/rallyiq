import React, {useEffect, useState} from 'react'
import { ProbChart } from './components/ProbChart'
import { nextPlayProb } from './lib/model'

type LiveFrame = {
  ts: string
  game_id: string
  down?: number
  distance?: number
  yardline?: number
  quarter?: number
  clock?: string
  note?: string
}

export default function App() {
  const [frame, setFrame] = useState<LiveFrame | null>(null)
  const [history, setHistory] = useState<{ t: string; run: number; pass: number }[]>([])

  async function loadLive() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}live.json?_=' + Date.now())
      if (!res.ok) throw new Error('live.json not found')
      const data = await res.json() as LiveFrame
      setFrame(data)
      const probs = nextPlayProb(data)
      setHistory(h => [...h.slice(-30), { t: data.ts, run: probs.run, pass: probs.pass }])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadLive()
    const id = setInterval(loadLive, 5000)
    return () => clearInterval(id)
  }, [])

  const probs = nextPlayProb(frame || {})

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h1 style={styles.title}>RallyIQ</h1>
        <p style={styles.subtitle}>Previsões por jogada (MVP PWA)</p>
      </header>

      <section style={styles.card}>
        <div style={styles.row}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Próxima jogada</div>
            <div style={styles.metricValue}>
              🏈 {probs.run > probs.pass ? 'Corrida' : 'Passe'}
            </div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Prob. Corrida</div>
            <div style={styles.metricValue}>{(probs.run*100).toFixed(1)}%</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Prob. Passe</div>
            <div style={styles.metricValue}>{(probs.pass*100).toFixed(1)}%</div>
          </div>
        </div>
        <div style={{height: 220, marginTop: 12}}>
          <ProbChart data={history} />
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={{margin: 0}}>Contexto do Lance</h3>
        <p style={{marginTop: 8}}>
          {frame
            ? <>Q{frame.quarter} • {frame.clock} • 3rd &amp; {frame.distance} na {frame.yardline} • {frame.note}</>
            : 'Aguardando live.json...'
          }
        </p>
        <a style={styles.cta} href="#" onClick={e=>e.preventDefault()}>Aposte agora (placeholder)</a>
      </section>

      <footer style={styles.footer}>
        <small>© 2025 RallyIQ — MVP. Instalável como PWA no Android e iOS.</small>
      </footer>
    </div>
  )
}

const styles: {[k:string]: React.CSSProperties} = {
  wrap: { maxWidth: 920, margin: '0 auto', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial' },
  header: { padding: 12, textAlign: 'center' },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: 0, opacity: 0.8 },
  card: { background: '#0B0F19', color: 'white', borderRadius: 16, padding: 16, marginTop: 16, boxShadow: '0 6px 20px rgba(0,0,0,0.2)' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  metric: { flex: '1 1 180px', background: '#121826', padding: 12, borderRadius: 12 },
  metricLabel: { opacity: 0.8 },
  metricValue: { fontSize: 20, fontWeight: 700 },
  footer: { textAlign: 'center', marginTop: 16, opacity: 0.7 },
  cta: { display: 'inline-block', marginTop: 8, background: 'white', color: '#0B0F19', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }
}
