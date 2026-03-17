import { Sun } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  description?: string
  onChange: (v: number) => void
}

function SliderField({ label, value, min, max, step, unit, description, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="font-medium">{label}</label>
        <span className="text-muted-foreground">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export function SolarConfigForm() {
  const { solarConfig, setSolarConfig } = useAppStore()

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <h2 className="font-semibold flex items-center gap-2">
        <Sun className="h-4 w-4 text-primary" />
        Solcelleanlæg
      </h2>

      <SliderField
        label="Installeret effekt"
        value={solarConfig.peakKw}
        min={1}
        max={20}
        step={0.5}
        unit="kWp"
        description="Samlet toppeffekt for dit anlæg"
        onChange={(v) => setSolarConfig({ peakKw: v })}
      />

      <SliderField
        label="Hældning"
        value={solarConfig.tiltDeg}
        min={0}
        max={90}
        step={5}
        unit="°"
        description="0° = vandret, 35° er typisk for dansk tag"
        onChange={(v) => setSolarConfig({ tiltDeg: v })}
      />

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label className="font-medium">Retning (azimut)</label>
          <span className="text-muted-foreground">
            {azimuthLabel(solarConfig.azimuthDeg)} ({solarConfig.azimuthDeg}°)
          </span>
        </div>
        <input
          type="range"
          min={-90}
          max={90}
          step={5}
          value={solarConfig.azimuthDeg}
          onChange={(e) => setSolarConfig({ azimuthDeg: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          -90° = øst, 0° = syd (optimalt), 90° = vest
        </p>
      </div>

      <SliderField
        label="Systemtab"
        value={solarConfig.systemLossPct}
        min={5}
        max={30}
        step={1}
        unit="%"
        description="Inkl. kabelstab, vekselretter, snavs. 14% er typisk."
        onChange={(v) => setSolarConfig({ systemLossPct: v })}
      />
    </div>
  )
}

function azimuthLabel(deg: number): string {
  if (deg <= -67) return 'Øst'
  if (deg <= -22) return 'Øst-syd'
  if (deg <= 22) return 'Syd'
  if (deg <= 67) return 'Syd-vest'
  return 'Vest'
}
