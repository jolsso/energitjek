import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { HourlySimulation } from '@/types'

interface Props {
  hourly: HourlySimulation[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

const COLORS = {
  spot:   'hsl(142,71%,40%)',  // green  — avoided spot cost
  tariff: 'hsl(38,92%,52%)',   // amber  — avoided tariffs/taxes
  feedIn: 'hsl(217,91%,60%)',  // blue   — export revenue
}

function aggregateSavingsByMonth(hourly: HourlySimulation[]) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: MONTH_NAMES[i],
    spot: 0,
    tariff: 0,
    feedIn: 0,
  }))

  for (const h of hourly) {
    const month = new Date(h.hourStart).getMonth()
    months[month].spot   += h.spotSavedDkk
    months[month].tariff += h.tariffSavedDkk
    months[month].feedIn += h.feedInDkk
  }

  return months.map(m => ({
    name:   m.name,
    spot:   Math.round(m.spot),
    tariff: Math.round(m.tariff),
    feedIn: Math.round(m.feedIn),
  }))
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const spot   = (payload.find(p => p.dataKey === 'spot')?.value   as number) ?? 0
  const tariff = (payload.find(p => p.dataKey === 'tariff')?.value as number) ?? 0
  const feedIn = (payload.find(p => p.dataKey === 'feedIn')?.value as number) ?? 0
  const total  = spot + tariff + feedIn

  const fmt = (v: number) => v.toLocaleString('da-DK') + ' kr.'

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-3 text-xs shadow-md min-w-[190px] space-y-1.5">
      <p className="font-semibold text-sm">{label}</p>
      <div className="space-y-1">
        <Row color={COLORS.spot}   label="Undgået energiomk."  value={fmt(spot)} />
        <Row color={COLORS.tariff} label="Undgået afgifter & moms" value={fmt(tariff)} />
        <Row color={COLORS.feedIn} label="Salg til net"         value={fmt(feedIn)} />
      </div>
      <div className="border-t border-border pt-1.5 flex justify-between font-medium">
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
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
          Opdelt på undgået energiomkostning, undgåede afgifter og salg af overskudsstrøm
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} unit=" kr" axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                spot:   'Undgået energiomk.',
                tariff: 'Undgået afgifter & moms',
                feedIn: 'Salg til net',
              }
              return labels[value] ?? value
            }}
          />
          <Bar dataKey="spot"   stackId="a" fill={COLORS.spot} />
          <Bar dataKey="tariff" stackId="a" fill={COLORS.tariff} />
          <Bar dataKey="feedIn" stackId="a" fill={COLORS.feedIn} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
