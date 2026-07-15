import type { RoofSegment } from '@/types'
import { SliderField, TiltIllustration, azimuthLabel } from './SliderField'

interface RoofSegmentCardProps {
  segment: RoofSegment
  advanced: boolean
  title?: string
  peakKwMin?: number
  peakKwMax?: number
  peakKwStep?: number
  onUpdate: (partial: Partial<RoofSegment>) => void
}

export function RoofSegmentCard({
  segment,
  advanced,
  title,
  peakKwMin = 1,
  peakKwMax = 50,
  peakKwStep = 0.5,
  onUpdate,
}: RoofSegmentCardProps) {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}

      <SliderField
        label="Installeret effekt"
        value={segment.peakKw}
        min={peakKwMin}
        max={peakKwMax}
        step={peakKwStep}
        unit="kWp"
        description="Samlet toppeffekt for denne tag-flade"
        onChange={(v) => onUpdate({ peakKw: v })}
      />

      {advanced && (
        <>
          <SliderField
            label="Hældning"
            value={segment.tiltDeg}
            min={0}
            max={90}
            step={5}
            unit="°"
            description="0° = vandret, 35° er typisk for dansk tag"
            onChange={(v) => onUpdate({ tiltDeg: v })}
          >
            <TiltIllustration tiltDeg={segment.tiltDeg} />
          </SliderField>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Retning (azimut)</label>
              <span className="text-muted-foreground">
                {azimuthLabel(segment.azimuthDeg)} ({segment.azimuthDeg}°)
              </span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={5}
              value={segment.azimuthDeg}
              onChange={(e) => onUpdate({ azimuthDeg: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              -180°/180° = nord, -90° = øst, 0° = syd (optimalt), 90° = vest · Retning vises på kortet
            </p>
          </div>
        </>
      )}
    </div>
  )
}
