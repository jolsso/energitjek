import { useAppStore } from '@/store/appStore'
import { SummaryCards } from './SummaryCards'
import { MonthlyChart } from './MonthlyChart'

export function ResultsPanel() {
  const { simulationResult } = useAppStore()

  if (!simulationResult) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dine resultater</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Baseret på typisk solindstråling for din adresse (PVGIS-data fra EU-Kommissionen)
        </p>
      </div>

      <SummaryCards summary={simulationResult.summary} />
      <MonthlyChart hourly={simulationResult.hourly} />
    </div>
  )
}
