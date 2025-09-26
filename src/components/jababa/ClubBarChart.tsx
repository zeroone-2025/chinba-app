import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'

export function ClubBarChart({
  data,
  metric,
  colors
}: {
  data: { team: string; value: number }[]
  metric: string
  colors: (team: string, i: number) => string
}) {
  const unit = metric === '점수' ? '점' : metric === '활동 횟수' ? '회' : metric === '총 참여시간' ? '분' : '%'
  const maxVal = Math.max(1, ...data.map(d => d.value))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 24, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="team" tickMargin={8} />
        <YAxis domain={[0, Math.ceil(maxVal * 1.1)]} />
        <Tooltip formatter={(v: number) => `${metric === '참여율' ? v.toFixed(1) : v}${unit}`} />
        <Legend />
        <Bar dataKey="value" name={metric}>
          {data.map((d, i) => <Cell key={i} fill={colors(d.team, i)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}