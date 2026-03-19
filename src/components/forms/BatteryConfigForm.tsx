import { BatteryCharging } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { BatteryConfig } from '@/types'

const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  capacityKwh: 10,
  maxChargeKw: 5,
  maxDischargeKw: 5,
  roundTripEfficiencyPct: 90,
  strategy: 'self-consumption',
}

const STRATEGIES: { id: BatteryConfig['strategy']; label: string; desc: string }[] = [
  { id: 'self-consumption', label: 'Egenforbrug',  desc: 'Gem overskud til aftenforbrug' },
  { id: 'peak-shaving',     label: 'Peak-shaving', desc: 'Reducer spidsbelastning' },
  { id: 'time-of-use',      label: 'Time-of-use',  desc: 'Optimer efter timepris' },
]

export function BatteryConfigForm({ advanced = false }: { advanced?: boolean }) {
  const batteryConfig    = useAppStore((s) => s.batteryConfig)
  const setBatteryConfig = useAppStore((s) => s.setBatteryConfig)

  const enabled = batteryConfig !== null
  const config  = batteryConfig ?? DEFAULT_BATTERY_CONFIG

  const toggle = () => setBatteryConfig(enabled ? null : DEFAULT_BATTERY_CONFIG)
  const update = (partial: Partial<BatteryConfig>) =>
    setBatteryConfig({ ...config, ...partial })

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <BatteryCharging className="h-4 w-4 text-primary" />
          Batteri
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

      {enabled && (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Kapacitet</label>
              <span className="text-muted-foreground">{config.capacityKwh} kWh</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={config.capacityKwh}
              onChange={(e) => update({ capacityKwh: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">Batteriets brugbare kapacitet</p>
          </div>

          {advanced && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <label className="font-medium">Max. effekt (lade/aflade)</label>
                  <span className="text-muted-foreground">{config.maxChargeKw} kW</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={config.maxChargeKw}
                  onChange={(e) => {
                    const kw = Number(e.target.value)
                    update({ maxChargeKw: kw, maxDischargeKw: kw })
                  }}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">Maks. lade- og afladeveffekt</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Strategi</label>
                <div className="grid grid-cols-1 gap-1.5 mt-1">
                  {STRATEGIES.map(({ id, label, desc }) => (
                    <label
                      key={id}
                      className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="battery-strategy"
                        checked={config.strategy === id}
                        onChange={() => update({ strategy: id })}
                        className="mt-0.5 accent-primary shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
