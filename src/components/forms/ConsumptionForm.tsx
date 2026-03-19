import { useState } from 'react'
import { Zap, Info } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { ConsumptionProfile } from '@/types'

const BASE_PRESETS: { label: string; kwh: number }[] = [
  { label: 'Lejlighed',    kwh: 2500 },
  { label: 'Parcelhus',    kwh: 5000 },
  { label: 'Stor familie', kwh: 8000 },
]

const HEATPUMP_KWH = 6500

function evKwh(kmPerDay: number) {
  return Math.round(kmPerDay * 0.2 * 365)
}

function deriveProfile(hp: boolean, ev: boolean): ConsumptionProfile {
  if (ev) return 'ev'
  if (hp) return 'heatpump'
  return 'standard'
}

export function ConsumptionForm() {
  const { consumption, setConsumption } = useAppStore()

  // Initialise local state from current store values
  const [baseKwh, setBaseKwh] = useState(() => {
    const closest = BASE_PRESETS.reduce((a, b) =>
      Math.abs(b.kwh - consumption.annualKwh) < Math.abs(a.kwh - consumption.annualKwh) ? b : a
    )
    return closest.kwh
  })
  const [hasHeatpump, setHasHeatpump] = useState(() => consumption.profile === 'heatpump')
  const [hasEV, setHasEV]             = useState(() => consumption.profile === 'ev')
  const [evKmPerDay, setEvKmPerDay]   = useState(50)

  function computedKwh(base = baseKwh, hp = hasHeatpump, ev = hasEV, km = evKmPerDay) {
    return base + (hp ? HEATPUMP_KWH : 0) + (ev ? evKwh(km) : 0)
  }

  function sync(overrides?: { base?: number; hp?: boolean; ev?: boolean; km?: number }) {
    const base = overrides?.base ?? baseKwh
    const hp   = overrides?.hp   ?? hasHeatpump
    const ev   = overrides?.ev   ?? hasEV
    const km   = overrides?.km   ?? evKmPerDay
    setConsumption({
      annualKwh:  computedKwh(base, hp, ev, km),
      profile:    deriveProfile(hp, ev),
      source:     'manual',
      hourlyKwh:  undefined,
    })
  }

  function handleBase(kwh: number) {
    setBaseKwh(kwh)
    sync({ base: kwh })
  }

  function handleHeatpump(checked: boolean) {
    setHasHeatpump(checked)
    sync({ hp: checked })
  }

  function handleEV(checked: boolean) {
    setHasEV(checked)
    sync({ ev: checked })
  }

  function handleEvKm(km: number) {
    setEvKmPerDay(km)
    sync({ km })
  }

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Forbrug
        <span className="group relative">
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="font-medium text-foreground mb-1">Timeprofil for forbrug</p>
            <p>Forbruget fordeles efter en typisk dansk husholdningsprofil, ikke fladt over alle timer:</p>
            <ul className="mt-1.5 space-y-0.5">
              <li>🌙 <span className="text-foreground">Nat (00–05):</span> lavt forbrug</li>
              <li>☀️ <span className="text-foreground">Dag (09–16):</span> lavere på hverdage</li>
              <li>🌆 <span className="text-foreground">Aften (18–20):</span> forbrugspeak</li>
              <li>🔌 <span className="text-foreground">El-bil:</span> opladning primært om natten</li>
            </ul>
            <p className="mt-1.5">Totalt årstal er uændret.</p>
          </div>
        </span>
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

      {/* Add-ons */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tillæg</p>
        <div className="space-y-2">

          {/* Heat pump toggle */}
          <div className={`rounded-lg border p-3 transition-colors ${hasHeatpump ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Varmepumpe</p>
                <p className="text-xs text-muted-foreground">+{HEATPUMP_KWH.toLocaleString('da-DK')} kWh/år</p>
              </div>
              <button
                onClick={() => handleHeatpump(!hasHeatpump)}
                role="switch"
                aria-checked={hasHeatpump}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  hasHeatpump ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${hasHeatpump ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* EV toggle */}
          <div className={`rounded-lg border p-3 transition-colors ${hasEV ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">El-bil</p>
                <p className="text-xs text-muted-foreground">
                  {hasEV ? `+${evKwh(evKmPerDay).toLocaleString('da-DK')} kWh/år` : 'Hjemmeopladning om natten'}
                </p>
              </div>
              <button
                onClick={() => handleEV(!hasEV)}
                role="switch"
                aria-checked={hasEV}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  hasEV ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${hasEV ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            {hasEV && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Daglig køreafstand</span>
                  <span className="font-medium">{evKmPerDay} km/dag</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={5}
                  value={evKmPerDay}
                  onChange={(e) => handleEvKm(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fine-tune slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label htmlFor="annual-kwh" className="font-medium">Samlet forbrug</label>
          <span className="text-muted-foreground">{consumption.annualKwh.toLocaleString('da-DK')} kWh/år</span>
        </div>
        <input
          id="annual-kwh"
          type="range"
          min={1000}
          max={30000}
          step={250}
          value={consumption.annualKwh}
          onChange={(e) =>
            setConsumption({
              annualKwh:  parseInt(e.target.value),
              profile:    deriveProfile(hasHeatpump, hasEV),
              source:     'manual',
              hourlyKwh:  undefined,
            })
          }
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Justér det samlede forbrug manuelt hvis nødvendigt
        </p>
      </div>
    </div>
  )
}
