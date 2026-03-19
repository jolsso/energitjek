import { useAppStore } from '@/store/appStore'
import { SummaryCards } from './SummaryCards'
import { EnergyFlowChart } from './EnergyFlowChart'
import { MonthlyChart } from './MonthlyChart'
import { MonthlySavingsChart } from './MonthlySavingsChart'
import { PaybackChart } from './PaybackChart'

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
  const { simulationResult, pvgisData, investmentDkk, solarConfig, address } = useAppStore()

  if (!simulationResult) return null

  // Derive data year from first hourly entry (format: "2023-01-01T…")
  const dataYear = simulationResult.hourly[0]?.hourStart.slice(0, 4) ?? null

  const systemDesc = `${solarConfig.peakKw} kWp · ${azimuthShort(solarConfig.azimuthDeg)} · ${solarConfig.tiltDeg}° hældning`
  const shortAddress = address.split(',')[0]?.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {shortAddress ? `Potentiale for ${shortAddress}` : 'Dine resultater'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-muted-foreground text-sm">{systemDesc}</span>
          {dataYear && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Data: {dataYear}
            </span>
          )}
          {pvgisData && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {pvgisData.location.lat.toFixed(2)}°N, {pvgisData.location.lon.toFixed(2)}°Ø
            </span>
          )}
        </div>
      </div>

      <SummaryCards summary={simulationResult.summary} investmentDkk={investmentDkk} />
      {investmentDkk > 0 && (
        <PaybackChart
          investmentDkk={investmentDkk}
          annualSavedDkk={simulationResult.summary.annualSavedDkk}
        />
      )}
      {advanced && (
        <>
          <EnergyFlowChart summary={simulationResult.summary} />
          <MonthlyChart hourly={simulationResult.hourly} />
          <MonthlySavingsChart hourly={simulationResult.hourly} />
        </>
      )}
    </div>
  )
}
