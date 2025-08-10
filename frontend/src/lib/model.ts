type Frame = {
  down?: number
  distance?: number
  yardline?: number
  quarter?: number
}

export function nextPlayProb(f: Frame | any) {
  const down = f.down ?? 1
  const distance = f.distance ?? 10
  const yardline = f.yardline ?? 50

  let run = 0.5
  let pass = 0.5

  if (down === 3 && distance <= 2) { run += 0.12; pass -= 0.12 }
  if (distance >= 8) { pass += 0.15; run -= 0.15 }
  if (yardline <= 20) { run += 0.08; pass -= 0.08 }

  if (run < 0) run = 0
  if (pass < 0) pass = 0
  const s = run + pass
  if (s > 0) { run/=s; pass/=s }

  return { run, pass }
}
