import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList
} from 'recharts'

type Metric = '점수' | '활동 횟수' | '총 참여시간' | '참여율';

interface ClubLineChartProps {
  data: Array<Record<string, any>>
  teams: string[]
  metric: Metric
  maxVal: number
}

const PALETTE = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#9333ea', // purple
  '#f59e0b', // amber
  '#0891b2', // cyan
  '#e11d48', // rose
]

const colorOf = (team: string, i: number): string =>
  PALETTE[i % PALETTE.length]

// Custom Tooltip Component
const MetricTooltip = ({ active, payload, label, metric }: {
  active?: boolean;
  payload?: any[];
  label?: string;
  metric: Metric;
}) => {
  if (!active || !payload?.length) return null;

  const p0 = payload[0];
  const team = p0.dataKey as string;
  const v = Number(p0.value ?? 0);

  const unit = metric === '점수' ? '점'
             : metric === '활동 횟수' ? '회'
             : metric === '총 참여시간' ? '분'
             : '%';

  const val = metric === '참여율' ? v.toFixed(1) : v;

  return (
    <div className="rounded-md border bg-white/90 p-2 text-sm shadow">
      <div className="font-medium">{team}</div>
      <div>{metric}: <b>{val}{unit}</b></div>
    </div>
  );
};

const ClubLineChart = ({ data, teams, metric, maxVal }: ClubLineChartProps) => {
  if (data.length === 0 || teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        데이터가 없습니다.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ left: 24, right: 16, top: 8, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="name"
          padding={{ left: 24, right: 24 }}
          tickMargin={8}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          domain={[0, Math.ceil(maxVal * 1.1)]}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<MetricTooltip metric={metric} />} />
        <Legend />

        {teams.map((team, idx) => (
          <Line
            key={team}
            type="monotone"
            dataKey={team}
            stroke={colorOf(team, idx)}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ClubLineChart