import { Zap, Sun, TrendingDown, Percent, Leaf } from 'lucide-react'
import type { SimulationSummary } from '@/types'
import { formatDkk, formatKwh, formatPct } from '@/lib/utils'

interface Props {
  summary: SimulationSummary
}

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
      {cards.map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card card-shadow p-3 sm:p-4 space-y-1.5 sm:space-y-2"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span className="leading-tight">{label}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground leading-tight">{sub}</div>
        </div>
      ))}
    </div>
  )
}
