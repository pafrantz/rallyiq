import React from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type D = { t: string; run: number; pass: number }

export function ProbChart({ data }: { data: D[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" hide />
        <YAxis domain={[0,1]} tickFormatter={(v)=> (v*100).toFixed(0)+'%'} />
        <Tooltip formatter={(v:any)=> (Number(v)*100).toFixed(1)+'%'} />
        <Line type="monotone" dataKey="run" dot={false} />
        <Line type="monotone" dataKey="pass" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
