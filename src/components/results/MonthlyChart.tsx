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
  egenforbrug: 'hsl(142,71%,40%)',   // green  — solar used directly
  overskud:    'hsl(38,92%,52%)',    // amber  — exported to grid
  underskud:   'hsl(0,72%,58%)',     // red    — imported from grid
}

function aggregateByMonth(hourly: HourlySimulation[]) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: MONTH_NAMES[i],
    egenforbrug: 0,
    overskud: 0,
    underskud: 0,
  }))

  for (const h of hourly) {
    const month = new Date(h.hourStart).getMonth()
    months[month].egenforbrug += h.selfConsumedKwh
    months[month].overskud    += h.gridExportKwh
    months[month].underskud   += h.gridImportKwh
  }

  return months.map(m => {
    const eg  = Math.round(m.egenforbrug)
    const ov  = Math.round(m.overskud)
    const und = Math.round(m.underskud)
    return {
      name: m.name,
      egenforbrug: eg,
      overskud:    ov,
      // Invisible bar that resets the cumulative stack back to 0 before
      // drawing underskud, so the red bar always starts exactly at zero.
      underskudOffset: -(eg + ov),
      underskud: -und,
    }
  })
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const eg  = payload.find(p => p.dataKey === 'egenforbrug')?.value as number ?? 0
  const ov  = payload.find(p => p.dataKey === 'overskud')?.value as number ?? 0
  const und = Math.abs(payload.find(p => p.dataKey === 'underskud')?.value as number ?? 0)
  const production = eg + ov
  const net = ov - und  // net = eksport - import

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-3 text-xs shadow-md space-y-1.5 min-w-[160px]">
      <p className="font-semibold text-sm">{label}</p>
      <div className="space-y-1">
        <Row color={COLORS.egenforbrug} label="Egenforbrug" value={eg as number} />
        <Row color={COLORS.overskud}    label="Overskud (eksport)" value={ov as number} />
        <Row color={COLORS.underskud}   label="Underskud (import)" value={und} />
      </div>
      <div className="border-t border-border pt-1.5 space-y-0.5">
        <div className="flex justify-between text-muted-foreground">
          <span>Produktion</span><span>{production} kWh</span>
        </div>
        <div className={`flex justify-between font-medium ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <span>{net >= 0 ? 'Netto overskud' : 'Netto underskud'}</span>
          <span>{net >= 0 ? '+' : ''}{net} kWh</span>
        </div>
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value} kWh</span>
    </div>
  )
}

export function MonthlyChart({ hourly }: Props) {
  const data = aggregateByMonth(hourly)

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Månedlig oversigt</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stablet efter hvad solcellerne dækker, hvad der eksporteres, og hvad der stadig importeres fra nettet.
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} unit=" kWh" axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                egenforbrug: 'Egenforbrug',
                overskud:    'Overskud (eksport)',
                underskud:   'Underskud (import)',
              }
              return labels[value] ?? value
            }}
          />
          <Bar dataKey="egenforbrug"     stackId="a" fill={COLORS.egenforbrug} />
          <Bar dataKey="overskud"        stackId="a" fill={COLORS.overskud} radius={[3, 3, 0, 0]} />
          <Bar dataKey="underskudOffset" stackId="a" fill="transparent" legendType="none" tooltipType="none" />
          <Bar dataKey="underskud"       stackId="a" fill={COLORS.underskud} radius={[0, 0, 3, 3]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
