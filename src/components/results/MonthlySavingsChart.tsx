import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts'
import type { HourlySimulation } from '@/types'

interface Props {
  hourly: HourlySimulation[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
const BAR_COLOR = 'hsl(142,71%,40%)'

function aggregateSavingsByMonth(hourly: HourlySimulation[]) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: MONTH_NAMES[i],
    savings: 0,
  }))

  for (const h of hourly) {
    const month = new Date(h.hourStart).getMonth()
    months[month].savings += h.savedDkk
  }

  return months.map(m => ({
    name: m.name,
    savings: Math.round(m.savings),
  }))
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const savings = payload[0]?.value ?? 0

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-3 text-xs shadow-md min-w-[120px]">
      <p className="font-semibold text-sm mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Besparelse</span>
        <span className="font-medium">{(savings as number).toLocaleString('da-DK')} DKK</span>
      </div>
    </div>
  )
}

export function MonthlySavingsChart({ hourly }: Props) {
  const data = aggregateSavingsByMonth(hourly)

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Månedlig besparelse (DKK)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Baseret på reelle spotpriser + faste afgifter
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} unit=" kr" axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
          <Bar dataKey="savings" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.savings >= 0 ? BAR_COLOR : 'hsl(0,72%,58%)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
