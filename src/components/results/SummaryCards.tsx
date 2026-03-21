import { Zap, Sun, TrendingDown, Percent, Leaf } from 'lucide-react'
import type { SimulationSummary } from '@/types'
import { formatDkk, formatKwh, formatPct } from '@/lib/utils'

interface Props {
  summary: SimulationSummary
}

const cardAccents = [
  { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', topBar: 'bg-amber-400' },
  { iconBg: 'bg-sky-100', iconColor: 'text-sky-600', topBar: 'bg-sky-400' },
  { iconBg: 'bg-violet-100', iconColor: 'text-violet-600', topBar: 'bg-violet-400' },
  { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', topBar: 'bg-emerald-400' },
  { iconBg: 'bg-teal-100', iconColor: 'text-teal-600', topBar: 'bg-teal-400' },
]

export function SummaryCards({ summary }: Props) {
  const cards = [
    {
      icon: Sun,
      label: 'Årlig produktion',
      value: formatKwh(summary.annualProductionKwh),
      sub: 'Estimeret solcelleproduktion',
    },
    {
      icon: Percent,
      label: 'Dækningsgrad',
      value: formatPct(summary.coveragePct),
      sub: 'Af dit forbrug dækket af sol',
    },
    {
      icon: Zap,
      label: 'Egenforbrugspct.',
      value: formatPct(summary.selfConsumptionPct),
      sub: 'Af produktionen brugt selv',
    },
    {
      icon: TrendingDown,
      label: 'Estimeret besparelse',
      value: formatDkk(summary.annualSavedDkk),
      sub: 'Pr. år (inkl. salg til net)',
    },
    {
      icon: Leaf,
      label: 'CO₂-reduktion',
      value: summary.co2SavedKg >= 1000
        ? `${(summary.co2SavedKg / 1000).toFixed(1).replace('.', ',')} t`
        : `${Math.round(summary.co2SavedKg)} kg`,
      sub: 'Undgået CO₂ pr. år',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4" style={{ gridAutoRows: '1fr' }}>
      {cards.map(({ icon: Icon, label, value, sub }, i) => {
        const accent = cardAccents[i]
        return (
          <div
            key={label}
            className="rounded-xl border border-border bg-card card-shadow overflow-hidden"
          >
            <div className={`h-1 w-full ${accent.topBar}`} />
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent.iconBg} shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${accent.iconColor}`} />
                </div>
                <span className="text-muted-foreground text-xs sm:text-sm leading-tight">{label}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
