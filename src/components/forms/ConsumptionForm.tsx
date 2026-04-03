import { useState } from 'react'
import { Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { EloverblikSetupForm } from './EloverblikSetupForm'

const BASE_PRESETS: { label: string; kwh: number }[] = [
  { label: 'Lejlighed',    kwh: 2500 },
  { label: 'Parcelhus',    kwh: 5000 },
  { label: 'Stor familie', kwh: 8000 },
]

export function ConsumptionForm({ onEloverblikComplete }: { onEloverblikComplete?: () => void }) {
  const { consumption, setConsumption } = useAppStore()
  const [eloverblikOpen, setEloverblikOpen] = useState(false)

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
    <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
      {/* Eloverblik — precise path */}
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
            <p className="text-sm font-medium">Hent faktiske forbrugsdata fra Eloverblik</p>
            <p className="text-xs text-muted-foreground">Mere præcist — henter adresse og timebaseret forbrug automatisk</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-[10px] font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5">
            Anbefalet
          </span>
          {eloverblikOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {eloverblikOpen && (
        <div className="border-t border-border p-4">
          <EloverblikSetupForm embedded onComplete={onEloverblikComplete} />
        </div>
      )}

      {/* Manual fallback */}
      {consumption.source !== 'eloverblik' && (
        <div className="border-t border-border p-5 space-y-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eller angiv manuelt</p>

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
      )}
    </div>
  )
}
