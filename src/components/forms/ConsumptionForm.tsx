import { Zap, Info } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { ConsumptionProfile } from '@/types'

const PRESETS: { label: string; kwh: number; profile: ConsumptionProfile }[] = [
  { label: 'Lejlighed',      kwh: 2500,  profile: 'standard' },
  { label: 'Parcelhus',      kwh: 5000,  profile: 'standard' },
  { label: 'Stor familie',   kwh: 8000,  profile: 'standard' },
  { label: 'Varmepumpe',     kwh: 12000, profile: 'heatpump' },
  // El-bil: 5.000 kWh basis + km/dag × 0,2 kWh/km × 365 dage
  { label: 'El-bil 50 km',  kwh: 8650,  profile: 'ev' },
  { label: 'El-bil 100 km', kwh: 12300, profile: 'ev' },
]

export function ConsumptionForm() {
  const { consumption, setConsumption } = useAppStore()

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Forbrug
        <span className="group relative">
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="font-medium text-foreground mb-1">Ugeprofil for statisk forbrug</p>
            <p>Forbruget fordeles efter en typisk dansk husholdningsprofil frem for fladt over alle timer:</p>
            <ul className="mt-1.5 space-y-0.5">
              <li>🌙 <span className="text-foreground">Nat (00–05):</span> lavt forbrug</li>
              <li>☀️ <span className="text-foreground">Dag (09–16):</span> lavere på hverdage</li>
              <li>🌆 <span className="text-foreground">Aften (18–20):</span> forbrugspeak</li>
              <li>📅 <span className="text-foreground">Weekend:</span> +8–12 % ift. hverdage</li>
            </ul>
            <p className="mt-1.5">Totalt årstal er uændret.</p>
          </div>
        </span>
      </h2>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ label, kwh, profile }) => {
            const active = consumption.annualKwh === kwh
            return (
              <button
                key={kwh}
                onClick={() => setConsumption({ annualKwh: kwh, profile, source: 'manual', hourlyKwh: undefined })}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <label htmlFor="annual-kwh" className="font-medium">Årligt elforbrug</label>
            <span className="text-muted-foreground">{consumption.annualKwh.toLocaleString('da-DK')} kWh</span>
          </div>
          <input
            id="annual-kwh"
            type="range"
            min={1000}
            max={30000}
            step={250}
            value={consumption.annualKwh}
            onChange={(e) => setConsumption({ annualKwh: parseInt(e.target.value), source: 'manual', hourlyKwh: undefined })}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            En gennemsnitlig dansk husstand bruger ca. 5.000 kWh/år
          </p>
        </div>
      </div>
    </div>
  )
}
