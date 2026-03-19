import { Zap, Info } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { HEATPUMP_ADDON_KWH } from '@/lib/simulation'

function evKwh(kmPerDay: number) {
  return Math.round(kmPerDay * 0.2 * 365)
}

export function ConsumptionAddonsForm() {
  const { heatpumpEnabled, setHeatpumpEnabled, evKmPerDay, setEvKmPerDay } = useAppStore()
  const evEnabled = evKmPerDay !== null

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Forbrug tillæg
        <span className="group relative">
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-72 -translate-x-1/2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="font-medium text-foreground mb-1.5">Tillæg til husstanden forbrug</p>
            <p className="mb-1.5"><span className="font-medium text-foreground">Varmepumpe</span> — tilføjer {HEATPUMP_ADDON_KWH.toLocaleString('da-DK')} kWh/år med en jævn lastprofil (morgen- og eftermiddagspeak).</p>
            <p><span className="font-medium text-foreground">El-bil</span> — 200 Wh/km. Opladning skemalægges automatisk til de billigste tilgængelige timer mellem kl. 21 og 06 baseret på spotpriser. Max. ladeeffekt: 7,4 kW.</p>
          </div>
        </span>
      </h2>

      {/* Heat pump */}
      <div className={`rounded-lg border p-3 transition-colors ${heatpumpEnabled ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Varmepumpe</p>
            <p className="text-xs text-muted-foreground">+{HEATPUMP_ADDON_KWH.toLocaleString('da-DK')} kWh/år</p>
          </div>
          <button
            onClick={() => setHeatpumpEnabled(!heatpumpEnabled)}
            role="switch"
            aria-checked={heatpumpEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              heatpumpEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${heatpumpEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* EV */}
      <div className={`rounded-lg border p-3 transition-colors ${evEnabled ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">El-bil</p>
            <p className="text-xs text-muted-foreground">
              {evEnabled
                ? `+${evKwh(evKmPerDay!).toLocaleString('da-DK')} kWh/år · billigste timer 21–06`
                : 'Oplades i billigste timer 21–06'}
            </p>
          </div>
          <button
            onClick={() => setEvKmPerDay(evEnabled ? null : 50)}
            role="switch"
            aria-checked={evEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              evEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${evEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        {evEnabled && (
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
              value={evKmPerDay!}
              onChange={(e) => setEvKmPerDay(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>
    </div>
  )
}
