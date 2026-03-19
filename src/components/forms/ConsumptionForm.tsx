import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const BASE_PRESETS: { label: string; kwh: number }[] = [
  { label: 'Lejlighed',    kwh: 2500 },
  { label: 'Parcelhus',    kwh: 5000 },
  { label: 'Stor familie', kwh: 8000 },
]

export function ConsumptionForm() {
  const { consumption, setConsumption } = useAppStore()

  const [baseKwh, setBaseKwh] = useState(() => {
    const closest = BASE_PRESETS.reduce((a, b) =>
      Math.abs(b.kwh - consumption.annualKwh) < Math.abs(a.kwh - consumption.annualKwh) ? b : a
    )
    return closest.kwh
  })

  function handleBase(kwh: number) {
    setBaseKwh(kwh)
    setConsumption({ annualKwh: kwh, profile: 'standard', source: 'manual', hourlyKwh: undefined })
  }

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Forbrug
      </h2>

      {/* Base type */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Husstandstype</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BASE_PRESETS.map(({ label, kwh }) => (
            <button
              key={kwh}
              onClick={() => handleBase(kwh)}
              className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                baseKwh === kwh
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label htmlFor="annual-kwh" className="font-medium">Årligt forbrug</label>
          <span className="text-muted-foreground">{consumption.annualKwh.toLocaleString('da-DK')} kWh</span>
        </div>
        <input
          id="annual-kwh"
          type="range"
          min={1000}
          max={20000}
          step={250}
          value={consumption.annualKwh}
          onChange={(e) =>
            setConsumption({ annualKwh: parseInt(e.target.value), source: 'manual', hourlyKwh: undefined })
          }
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Gennemsnitlig dansk husstand: ca. 5.000 kWh/år
        </p>
      </div>
    </div>
  )
}
