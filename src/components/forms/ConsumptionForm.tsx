import { Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function ConsumptionForm() {
  const { consumption, setConsumption } = useAppStore()

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Forbrug
      </h2>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label htmlFor="annual-kwh" className="font-medium">
            Årligt elforbrug
          </label>
          <span className="text-muted-foreground">{consumption.annualKwh.toLocaleString('da-DK')} kWh</span>
        </div>
        <input
          id="annual-kwh"
          type="range"
          min={1000}
          max={30000}
          step={250}
          value={consumption.annualKwh}
          onChange={(e) => setConsumption({ annualKwh: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          En gennemsnitlig dansk husstand bruger ca. 5.000 kWh/år
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          Vil du bruge dit faktiske forbrug?{' '}
          <span className="text-muted-foreground italic">
            Eloverblik-integration kommer snart.
          </span>
        </p>
      </div>
    </div>
  )
}
