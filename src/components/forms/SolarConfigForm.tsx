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
  // Panel: pivot at bottom-left corner, rotates upward to the right
  const px = 36, py = 130  // pivot point (bottom-left of panel)
  const panelW = 150, panelH = 10

  // Angle arc
  const arcR = 38
  const arcEndX = px + arcR * Math.cos(rad)
  const arcEndY = py - arcR * Math.sin(rad)

  // Label at midpoint of arc
  const labelR = arcR + 18
  const labelX = px + labelR * Math.cos(rad / 2)
  const labelY = py - labelR * Math.sin(rad / 2)

  // Sun position: follows the panel face normal (-sin, -cos in SVG coords)
  // so it always sits above the side of the panel that catches sunlight
  const cx_panel = px + (panelW / 2) * Math.cos(rad) - (panelH / 2) * Math.sin(rad)
  const cy_panel = py - (panelW / 2) * Math.sin(rad) - (panelH / 2) * Math.cos(rad)
  const sunDist = 80
  const sunX = Math.max(18, Math.min(300, cx_panel - Math.sin(rad) * sunDist))
  const sunY = Math.max(15, cy_panel - Math.cos(rad) * sunDist)

  // Cell divider positions (5 dividers = 6 cells)
  const cellDividers = [1, 2, 3, 4, 5]

  return (
    <svg viewBox="0 0 320 145" className="w-full h-28 mt-1">
      {/* Ground line */}
      <line
        x1="0" y1={py + 3} x2="320" y2={py + 3}
        style={{ stroke: 'hsl(var(--border))' }} strokeWidth="1.5"
      />

      {/* Sun — tracks panel face direction */}
      <circle cx={sunX} cy={sunY} r="18"
        style={{ fill: 'hsl(var(--primary))' }} opacity="0.12" />
      <circle cx={sunX} cy={sunY} r="10"
        style={{ fill: 'hsl(var(--primary))' }} opacity="0.9" />

      {/* Angle arc */}
      {tiltDeg > 2 && (
        <path
          d={`M ${px + arcR} ${py} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
          fill="none"
          style={{ stroke: 'hsl(var(--primary))' }}
          strokeWidth="1.5"
          opacity="0.45"
        />
      )}

      {/* Angle label */}
      {tiltDeg > 6 && (
        <text
          x={labelX} y={labelY}
          fontSize="13"
          style={{ fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, system-ui, sans-serif' }}
          textAnchor="middle" dominantBaseline="middle"
        >
          {tiltDeg}°
        </text>
      )}

      {/* Solar panel — rotated rectangle around pivot */}
      <g transform={`rotate(${-tiltDeg} ${px} ${py})`}>
        {/* Panel body */}
        <rect
          x={px} y={py - panelH} width={panelW} height={panelH} rx="2.5"
          fill="#1e3a5f"
        />
        {/* Subtle cell grid */}
        {cellDividers.map(i => (
          <line
            key={i}
            x1={px + (panelW / 6) * i} y1={py - panelH}
            x2={px + (panelW / 6) * i} y2={py}
            stroke="#60a5fa" strokeWidth="0.7" opacity="0.3"
          />
        ))}
        {/* Top-edge highlight */}
        <line
          x1={px + 3} y1={py - panelH + 1.5} x2={px + panelW - 3} y2={py - panelH + 1.5}
          stroke="#93c5fd" strokeWidth="1" opacity="0.25" strokeLinecap="round"
        />
      </g>

      {/* Pivot dot */}
      <circle cx={px} cy={py} r="3"
        style={{ fill: 'hsl(var(--muted-foreground))' }} opacity="0.4"
      />
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
          min={-180}
          max={180}
          step={5}
          value={solarConfig.azimuthDeg}
          onChange={(e) => setSolarConfig({ azimuthDeg: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          -180°/180° = nord, -90° = øst, 0° = syd (optimalt), 90° = vest · Retning vises på kortet
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
  const d = ((deg % 360) + 360) % 360  // normalise to 0–360 for lookup
  const normalised = d > 180 ? d - 360 : d  // back to -180..180
  if (normalised <= -157) return 'Nord'
  if (normalised <= -112) return 'Nord-øst'
  if (normalised <= -67)  return 'Øst'
  if (normalised <= -22)  return 'Øst-syd'
  if (normalised <= 22)   return 'Syd'
  if (normalised <= 67)   return 'Syd-vest'
  if (normalised <= 112)  return 'Vest'
  if (normalised <= 157)  return 'Nord-vest'
  return 'Nord'
}
