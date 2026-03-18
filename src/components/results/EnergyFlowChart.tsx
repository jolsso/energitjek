import type { SimulationSummary } from '@/types'

interface Props {
  summary: SimulationSummary
}

interface FlowBarProps {
  label: string
  description: string
  leftLabel: string
  leftPct: number
  leftColor: string
  rightLabel: string
  rightColor: string
}

function FlowBar({ label, description, leftLabel, leftPct, leftColor, rightLabel, rightColor }: FlowBarProps) {
  const rightPct = 100 - leftPct
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {/* Bar */}
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        <div
          className={`flex items-center justify-center text-xs font-semibold text-white transition-all duration-700 ${leftColor}`}
          style={{ width: `${Math.max(leftPct, 5)}%` }}
        >
          {leftPct >= 12 && `${leftPct.toFixed(0)}%`}
        </div>
        <div
          className={`flex items-center justify-center text-xs font-medium transition-all duration-700 ${rightColor}`}
          style={{ width: `${Math.max(rightPct, 5)}%` }}
        >
          {rightPct >= 12 && `${rightPct.toFixed(0)}%`}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${leftColor}`} />
          {leftLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${rightColor}`} />
          {rightLabel}
        </span>
      </div>
    </div>
  )
}

export function EnergyFlowChart({ summary }: Props) {
  const coveragePct = Math.min(100, Math.round(summary.coveragePct))
  const selfConsumptionPct = Math.min(100, Math.round(summary.selfConsumptionPct))

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-6">
      <h3 className="font-semibold">Energiflow</h3>

      <FlowBar
        label="Dækningsgrad"
        description="Hvor meget dækker solen af dit forbrug?"
        leftLabel={`Sol dækker dit forbrug`}
        leftPct={coveragePct}
        leftColor="bg-amber-400"
        rightLabel="Importeret fra nettet"
        rightColor="bg-muted text-muted-foreground"
      />

      <FlowBar
        label="Egenforbrugspct."
        description="Hvad sker der med din produktion?"
        leftLabel="Brugt direkte i hjemmet"
        leftPct={selfConsumptionPct}
        leftColor="bg-primary"
        rightLabel="Eksporteret til nettet"
        rightColor="bg-blue-100 text-blue-700"
      />
    </div>
  )
}
