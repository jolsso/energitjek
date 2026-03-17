import { Zap, Sun, TrendingDown, Percent, CalendarClock, Leaf } from 'lucide-react'
import type { SimulationSummary } from '@/types'
import { formatDkk, formatKwh, formatPct } from '@/lib/utils'

interface Props {
  summary: SimulationSummary
  investmentDkk?: number
}

export function SummaryCards({ summary, investmentDkk = 0 }: Props) {
  const paybackYears = investmentDkk > 0 && summary.annualSavedDkk > 0
    ? investmentDkk / summary.annualSavedDkk
    : null

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
    {
      icon: Leaf,
      label: 'CO₂-reduktion',
      value: summary.co2SavedKg >= 1000
        ? `${(summary.co2SavedKg / 1000).toFixed(1).replace('.', ',')} t`
        : `${Math.round(summary.co2SavedKg)} kg`,
      sub: 'Undgået CO₂ pr. år',
    },
    ...(paybackYears != null ? [{
      icon: CalendarClock,
      label: 'Tilbagebetalingstid',
      value: `${paybackYears.toFixed(1).replace('.', ',')} år`,
      sub: `Ved investering på ${investmentDkk.toLocaleString('da-DK')} kr.`,
    }] : []),
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" style={{ gridAutoRows: '1fr' }}>
      {cards.map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card card-shadow p-4 space-y-2"
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
