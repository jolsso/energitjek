import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { HourlySimulation } from '@/types'

interface Props {
  hourly: HourlySimulation[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function aggregateByMonth(hourly: HourlySimulation[]) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: MONTH_NAMES[i],
    produktion: 0,
    forbrug: 0,
    egenforbrug: 0,
  }))

  for (const h of hourly) {
    const month = new Date(h.hourStart).getMonth()
    months[month].produktion += h.productionKwh
    months[month].forbrug += h.consumptionKwh
    months[month].egenforbrug += h.selfConsumedKwh
  }

  return months.map((m) => ({
    ...m,
    produktion: Math.round(m.produktion),
    forbrug: Math.round(m.forbrug),
    egenforbrug: Math.round(m.egenforbrug),
  }))
}

export function MonthlyChart({ hourly }: Props) {
  const data = aggregateByMonth(hourly)

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold">Månedlig oversigt</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit=" kWh" />
          <Tooltip
            formatter={(v: number, name: string) => [`${v} kWh`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="produktion" name="Produktion" fill="hsl(38,92%,50%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="egenforbrug" name="Egenforbrug" fill="hsl(142,71%,45%)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="forbrug" name="Forbrug" fill="hsl(215,16%,70%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
