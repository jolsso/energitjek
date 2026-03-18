import { Sun } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const DEFAULT_EXISTING: NonNullable<ReturnType<typeof useAppStore.getState>['existingSolarConfig']> = {
  peakKw: 6,
  tiltDeg: 35,
  azimuthDeg: 0,
  systemLossPct: 5,
}

export function ExistingSolarForm() {
  const existingSolarConfig    = useAppStore((s) => s.existingSolarConfig)
  const setExistingSolarConfig = useAppStore((s) => s.setExistingSolarConfig)

  const enabled = existingSolarConfig !== null
  const config  = existingSolarConfig ?? DEFAULT_EXISTING

  const toggle = () => setExistingSolarConfig(enabled ? null : DEFAULT_EXISTING)
  const update = (partial: Partial<typeof DEFAULT_EXISTING>) =>
    setExistingSolarConfig({ ...config, ...partial })

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 card-shadow p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2 text-amber-900">
          <Sun className="h-4 w-4 text-amber-600" />
          Eksisterende anlæg
        </h2>
        <button
          onClick={toggle}
          role="switch"
          aria-checked={enabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!enabled && (
        <p className="text-xs text-amber-700">
          Aktivér for at angive dit nuværende anlæg — vi rekonstruerer dit bruttoforbrug og simulerer effekten af en udvidelse.
        </p>
      )}

      {enabled && (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Installeret effekt</label>
              <span className="text-muted-foreground">{config.peakKw} kWp</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={config.peakKw}
              onChange={(e) => update({ peakKw: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">Dit nuværende anlægs toppeffekt</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Hældning</label>
              <span className="text-muted-foreground">{config.tiltDeg}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={config.tiltDeg}
              onChange={(e) => update({ tiltDeg: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Retning (azimut)</label>
              <span className="text-muted-foreground">{config.azimuthDeg}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={config.azimuthDeg}
              onChange={(e) => update({ azimuthDeg: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">-90° = øst · 0° = syd · 90° = vest</p>
          </div>

          <p className="text-xs text-amber-700 border-t border-amber-200 pt-3">
            Simulationsformen nedenfor repræsenterer den <span className="font-medium">udvidelse</span> du ønsker at beregne oven i dit nuværende anlæg.
          </p>
        </>
      )}
    </div>
  )
}
