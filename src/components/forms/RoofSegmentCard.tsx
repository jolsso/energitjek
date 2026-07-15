import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { RoofSegment } from '@/types'
import { DEFAULT_PANEL, estimateCapacityKw, estimatePanelCount, type PanelSpec } from '@/lib/roofCapacity'
import { SliderField, TiltIllustration, azimuthLabel } from './SliderField'

interface RoofSegmentCardProps {
  segment: RoofSegment
  title?: string
  peakKwMin?: number
  peakKwMax?: number
  peakKwStep?: number
  onUpdate: (partial: Partial<RoofSegment>) => void
}

export function RoofSegmentCard({
  segment,
  title,
  peakKwMin = 1,
  peakKwMax = 50,
  peakKwStep = 0.5,
  onUpdate,
}: RoofSegmentCardProps) {
  const [panelSpecOpen, setPanelSpecOpen] = useState(false)
  const [orientationOpen, setOrientationOpen] = useState(false)

  const roofWidthM = segment.roofWidthM ?? 6
  const roofHeightM = segment.roofHeightM ?? 4
  const panel: PanelSpec = {
    wattage: segment.panelWattage ?? DEFAULT_PANEL.wattage,
    widthM: segment.panelWidthM ?? DEFAULT_PANEL.widthM,
    heightM: segment.panelHeightM ?? DEFAULT_PANEL.heightM,
  }
  const estimatedKw = estimateCapacityKw(roofWidthM, roofHeightM, panel)
  const panelCount = estimatePanelCount(roofWidthM, roofHeightM, panel)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
        <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs ml-auto">
          <button
            onClick={() => onUpdate({ inputMode: 'capacity' })}
            className={`rounded-md px-2 py-1 font-medium transition-colors ${
              segment.inputMode === 'capacity' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Effekt (kWp)
          </button>
          <button
            onClick={() => onUpdate({
              inputMode: 'dimensions',
              roofWidthM: segment.roofWidthM ?? 6,
              roofHeightM: segment.roofHeightM ?? 4,
            })}
            className={`rounded-md px-2 py-1 font-medium transition-colors ${
              segment.inputMode === 'dimensions' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tagmål
          </button>
        </div>
      </div>

      {segment.inputMode === 'dimensions' ? (
        <>
          <SliderField
            label="Tagbredde"
            value={roofWidthM}
            min={1}
            max={20}
            step={0.5}
            unit="m"
            onChange={(v) => onUpdate({ roofWidthM: v })}
          />
          <SliderField
            label="Taglængde"
            value={roofHeightM}
            min={1}
            max={20}
            step={0.5}
            unit="m"
            onChange={(v) => onUpdate({ roofHeightM: v })}
          />
          <p className="text-sm text-muted-foreground">
            ≈ <span className="font-medium text-foreground">{estimatedKw.toFixed(1)} kWp</span> — {panelCount} paneler (groft estimat)
          </p>

          <button
            onClick={() => setPanelSpecOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {panelSpecOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Panelspecifikationer
          </button>

          {panelSpecOpen && (
            <div className="space-y-3 pl-3 border-l-2 border-border">
              <SliderField
                label="Paneleffekt"
                value={panel.wattage}
                min={300}
                max={600}
                step={10}
                unit="Wp"
                onChange={(v) => onUpdate({ panelWattage: v })}
              />
              <SliderField
                label="Panelbredde"
                value={panel.widthM}
                min={0.5}
                max={2.5}
                step={0.01}
                unit="m"
                onChange={(v) => onUpdate({ panelWidthM: v })}
              />
              <SliderField
                label="Panellængde"
                value={panel.heightM}
                min={0.5}
                max={3}
                step={0.01}
                unit="m"
                onChange={(v) => onUpdate({ panelHeightM: v })}
              />
            </div>
          )}
        </>
      ) : (
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
      )}

      <button
        onClick={() => setOrientationOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {orientationOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Hældning &amp; retning
      </button>

      {orientationOpen && (
        <div className="space-y-4 pl-3 border-l-2 border-border">
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
        </div>
      )}
    </div>
  )
}
