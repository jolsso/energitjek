import { useAppStore } from '@/store/appStore'
import { SummaryCards } from './SummaryCards'
import { EnergyFlowChart } from './EnergyFlowChart'
import { MonthlyChart } from './MonthlyChart'
import { MonthlySavingsChart } from './MonthlySavingsChart'
import { PaybackChart } from './PaybackChart'

export function ResultsPanel() {
  const { simulationResult, pvgisData, investmentDkk } = useAppStore()

  if (!simulationResult) return null

  // Derive data year from first hourly entry (format: "2023-01-01T…")
  const dataYear = simulationResult.hourly[0]?.hourStart.slice(0, 4) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dine resultater</h2>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <p className="text-muted-foreground text-sm">
            Baseret på solindstråling for din adresse (PVGIS · EU-Kommissionen)
          </p>
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
      <EnergyFlowChart summary={simulationResult.summary} />
      <MonthlyChart hourly={simulationResult.hourly} />
      <MonthlySavingsChart hourly={simulationResult.hourly} />
      {investmentDkk > 0 && (
        <PaybackChart
          investmentDkk={investmentDkk}
          annualSavedDkk={simulationResult.summary.annualSavedDkk}
        />
      )}
    </div>
  )
}
