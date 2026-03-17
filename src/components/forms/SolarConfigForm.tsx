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
  children?: React.ReactNode
}

function SliderField({ label, value, min, max, step, unit, description, onChange, children }: SliderFieldProps) {
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
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function TiltIllustration({ tiltDeg }: { tiltDeg: number }) {
  const rad = (tiltDeg * Math.PI) / 180
  const len = 62
  const ox = 18, oy = 56
  const ex = ox + len * Math.cos(rad)
  const ey = oy - len * Math.sin(rad)

  const arcR = 18
  const arcEndX = ox + arcR * Math.cos(rad)
  const arcEndY = oy - arcR * Math.sin(rad)

  const labelRad = rad / 2
  const labelR = arcR + 10
  const labelX = ox + labelR * Math.cos(labelRad)
  const labelY = oy - labelR * Math.sin(labelRad)

  const sunRays = [0, 45, 90, 135, 180, 225, 270, 315]

  return (
    <svg viewBox="0 0 130 72" className="w-full h-[68px] mt-1 rounded-lg overflow-hidden">
      {/* Sky */}
      <rect x="0" y="0" width="130" height="64" fill="#f0f4ff" />
      {/* Ground */}
      <rect x="0" y="64" width="130" height="8" fill="#e2e8f0" />
      <line x1="0" y1="64" x2="130" y2="64" stroke="#cbd5e1" strokeWidth="1" />

      {/* Sun */}
      <circle cx="112" cy="13" r="8" fill="#f59e0b" />
      {sunRays.map(a => {
        const r = (a * Math.PI) / 180
        return (
          <line
            key={a}
            x1={112 + 10 * Math.cos(r)} y1={13 + 10 * Math.sin(r)}
            x2={112 + 14 * Math.cos(r)} y2={13 + 14 * Math.sin(r)}
            stroke="#f59e0b" strokeWidth="1.5"
          />
        )
      })}

      {/* Angle arc */}
      {tiltDeg > 2 && (
        <path
          d={`M ${ox + arcR} ${oy} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.2"
          opacity="0.8"
        />
      )}

      {/* Angle label */}
      {tiltDeg > 6 && (
        <text
          x={labelX} y={labelY}
          fontSize="9" fill="#92400e"
          textAnchor="middle" dominantBaseline="middle"
        >
          {tiltDeg}°
        </text>
      )}

      {/* Panel shadow */}
      <line
        x1={ox + 1} y1={oy + 1} x2={ex + 1} y2={ey + 1}
        stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"
        opacity="0.4"
      />
      {/* Panel body */}
      <line
        x1={ox} y1={oy} x2={ex} y2={ey}
        stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"
      />
      {/* Panel cell grid hint */}
      <line
        x1={ox} y1={oy} x2={ex} y2={ey}
        stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round"
        strokeDasharray="7 7"
      />
      {/* Hinge */}
      <circle cx={ox} cy={oy} r="2.5" fill="#64748b" />
    </svg>
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
        max={50}
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
      >
        <TiltIllustration tiltDeg={solarConfig.tiltDeg} />
      </SliderField>

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
          -90° = øst, 0° = syd (optimalt), 90° = vest · Retning vises på kortet
        </p>
      </div>

      <SliderField
        label="Systemtab"
        value={solarConfig.systemLossPct}
        min={0}
        max={30}
        step={1}
        unit="%"
        description="Inkl. kabelstab, vekselretter, snavs. 5% er typisk for nyt anlæg."
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
