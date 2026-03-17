import { Zap, Sun, TrendingDown, Percent } from 'lucide-react'
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
      sub: 'Pr. år (ekskl. feed-in)',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      ))}
    </div>
  )
}
