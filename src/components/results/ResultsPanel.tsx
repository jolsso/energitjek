import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSimulation } from '@/hooks/useSimulation'
import { SummaryCards } from './SummaryCards'
import { EnergyFlowChart } from './EnergyFlowChart'
import { MonthlyChart } from './MonthlyChart'
import { MonthlySavingsChart } from './MonthlySavingsChart'
import { PaybackChart } from './PaybackChart'
import { InvestmentForm } from '@/components/forms/InvestmentForm'
import { EloverblikSetupForm } from '@/components/forms/EloverblikSetupForm'

function azimuthShort(deg: number): string {
  const n = ((deg % 360) + 360) % 360
  const d = n > 180 ? n - 360 : n
  if (d <= -157 || d > 157) return 'Nord'
  if (d <= -112) return 'NØ'
  if (d <= -67)  return 'Øst'
  if (d <= -22)  return 'SØ'
  if (d <= 22)   return 'Syd'
  if (d <= 67)   return 'SV'
  if (d <= 112)  return 'Vest'
  return 'NV'
}

export function ResultsPanel({ advanced = false }: { advanced?: boolean }) {
  const { simulationResult, pvgisData, investmentDkk, solarConfig, address, consumption } = useAppStore()
  const { runSimulation } = useSimulation()
  const [eloverblikOpen, setEloverblikOpen] = useState(false)

  if (!simulationResult) return null

  // Derive data year from first hourly entry (format: "2023-01-01T…")
  const dataYear = simulationResult.hourly[0]?.hourStart.slice(0, 4) ?? null

  const systemDesc = `${solarConfig.peakKw} kWp · ${azimuthShort(solarConfig.azimuthDeg)} · ${solarConfig.tiltDeg}° hældning`
  const shortAddress = address.split(',')[0]?.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold truncate">
          {shortAddress ? `Potentiale for ${shortAddress}` : 'Dine resultater'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-muted-foreground text-sm">{systemDesc}</span>
          {dataYear && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Data: {dataYear}
            </span>
          )}
          {consumption.source === 'eloverblik' && (
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Faktisk forbrug
            </span>
          )}
        </div>
      </div>

      <SummaryCards summary={simulationResult.summary} />

      {/* Eloverblik upgrade — only shown when using estimated consumption */}
      {consumption.source !== 'eloverblik' && (
        <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
          <button
            onClick={() => setEloverblikOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(36 96% 48%) 0%, hsl(24 96% 52%) 100%)' }}
              >
                <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-medium">Præciser med dine faktiske forbrugsdata</p>
                <p className="text-xs text-muted-foreground">Beregningen bruger pt. et estimeret forbrug — hent dit faktiske fra Eloverblik</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[10px] font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5">
                Mere præcist
              </span>
              {eloverblikOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </div>
          </button>
          {eloverblikOpen && (
            <div className="border-t border-border p-4">
              <EloverblikSetupForm embedded onComplete={runSimulation} />
            </div>
          )}
        </div>
      )}

      {/* Investment + payback — co-located so the slider and chart respond together */}
      <InvestmentForm />
      {investmentDkk > 0 && (
        <PaybackChart
          investmentDkk={investmentDkk}
          annualSavedDkk={simulationResult.summary.annualSavedDkk}
        />
      )}

      {/* Monthly energy overview — useful to everyone, not just power users */}
      <MonthlyChart hourly={simulationResult.hourly} />

      {advanced && (
        <>
          <EnergyFlowChart summary={simulationResult.summary} />
          <MonthlySavingsChart hourly={simulationResult.hourly} />
        </>
      )}
    </div>
  )
}
