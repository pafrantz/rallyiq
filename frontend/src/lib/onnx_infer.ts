// ONNX inference in the browser with onnxruntime-web (optional)
// Falls back to heuristics if model files are missing or load fails.
import * as ort from 'onnxruntime-web'

ort.env.wasm.wasmPaths = import.meta.env.BASE_URL + 'onnx/';

export type Context = {
  down: number; distance: number; yardline: number; quarter: number;
  clock_secs: number; score_diff: number;
  recent_gains: number[]; recent_clock: number[];
}

function std(x: number[], means: number[], scales: number[]) {
  return x.map((v,i)=> (v - (means[i] ?? 0)) / ((scales[i] ?? 1) || 1))
}
function platt(p: number, A: number, B: number) {
  const eps = 1e-6
  const pp = Math.min(1 - eps, Math.max(eps, p))
  const logit = Math.log(pp/(1-pp))
  const z = A*logit + B
  return 1/(1+Math.exp(-z))
}

// Minimal wavelet-like band stats (Haar level-2 on last 4 items)
function haarOnce(x: number[]) {
  const n = x.length
  const a: number[] = []
  const d: number[] = []
  for (let i=0;i<n;i+=2){ a.push((x[i]+x[i+1])/Math.SQRT2); d.push((x[i]-x[i+1])/Math.SQRT2) }
  return { a, d }
}
function haarLevel2(arr: number[]) {
  const l1 = haarOnce(arr); const l2 = haarOnce(l1.a)
  return { a2: l2.a, d2: l2.d, d1: l1.d }
}
function bandStats(x: number[]) {
  const n = x.length || 1
  let sum=0, sq=0
  for (const v of x){ sum+=v; sq+=v*v }
  const mean = sum/n
  const variance = Math.max(0, sq/n - mean*mean)
  const stdv = Math.sqrt(variance)
  return { energy: sq, rms: Math.sqrt(sq/n), mean, std: stdv }
}
function makeFeatures(ctx: Context) {
  const W=8
  const gains=[...ctx.recent_gains]; const clocks=[...ctx.recent_clock]
  while (gains.length<W) gains.unshift(0); while (clocks.length<W) clocks.unshift(0)
  const g4=gains.slice(-4), c4=clocks.slice(-4)
  const gw=haarLevel2(g4), cw=haarLevel2(c4)
  const feats = [
    ctx.down, ctx.distance, ctx.yardline, ctx.quarter, ctx.clock_secs, ctx.score_diff,
    ...Object.values(bandStats(gw.a2)),
    ...Object.values(bandStats(gw.d2)),
    ...Object.values(bandStats(gw.d1)),
    ...Object.values(bandStats(cw.a2)),
    ...Object.values(bandStats(cw.d2)),
    ...Object.values(bandStats(cw.d1)),
  ]
  return feats
}

let session: ort.InferenceSession | null = null
let featureMeta: { means: number[]; scales: number[]; feature_names: string[] } | null = null
let calib: { type: 'platt'; A: number; B: number } | null = null
let tried = false

async function ensureArtifacts(baseUrl: string) {
  if (session && featureMeta && calib) return true
  if (tried) return false
  tried = true
  try {
    const [modelBuf, metaRes, calRes] = await Promise.all([
      fetch(baseUrl + 'model/model_lightgbm.onnx').then(r => r.arrayBuffer()),
      fetch(baseUrl + 'model/feature_meta.json').then(r => r.json()),
      fetch(baseUrl + 'model/calibration.json').then(r => r.json()),
    ])
    session = await ort.InferenceSession.create(modelBuf)
    featureMeta = metaRes
    calib = calRes
    return true
  } catch {
    // artifacts ausentes: seguirá heurística
    return false
  }
}

export async function predictNextPlayONNX(ctx: Context): Promise<{run:number, pass:number} | null> {
  const base = import.meta.env.BASE_URL
  const ok = await ensureArtifacts(base)
  if (!ok || !session || !featureMeta) return null
  const feats = makeFeatures(ctx)
  const meta = featureMeta!
  const X = std(feats, meta.means, meta.scales)
  const input = new ort.Tensor('float32', Float32Array.from(X), [1, X.length])
  const out = await session!.run({ float_input: input })
  const firstKey = Object.keys(out)[0]
  const scores = out[firstKey].data as Float32Array
  const p_raw = scores.length===2 ? scores[1] : scores[0]
  const p_cal = calib?.type==='platt' ? platt(p_raw, calib.A, calib.B) : p_raw
  return { run: 1 - p_cal, pass: p_cal }
}
export async function predictNextPlay(ctx: Context) {
  const r = await predictNextPlayONNX(ctx)
  if (r) return r
  // fallback bobo
  const d = ctx.distance ?? 10
  const run = Math.max(0.1, Math.min(0.9, 0.5 + (2 - Math.min(d,10))*0.03))
  return { run, pass: 1 - run }
}