import { Sun } from 'lucide-react'
import { useAppStore, MAX_SEGMENTS } from '@/store/appStore'
import { getSegmentPeakKw } from '@/lib/roofCapacity'
import { SliderField } from './SliderField'
import { RoofSegmentCard } from './RoofSegmentCard'

export function SolarConfigForm({ label, advanced = false }: { label?: string; advanced?: boolean }) {
  const solarConfig = useAppStore((s) => s.solarConfig)
  const addSolarSegment = useAppStore((s) => s.addSolarSegment)
  const removeSolarSegment = useAppStore((s) => s.removeSolarSegment)
  const updateSolarSegment = useAppStore((s) => s.updateSolarSegment)
  const setSystemLossPct = useAppStore((s) => s.setSystemLossPct)

  const segments = solarConfig.segments
  const totalKw = segments.reduce((sum, seg) => sum + getSegmentPeakKw(seg), 0)

  const setSegmentCount = (target: number) => {
    const current = segments.length
    if (target > current) {
      for (let i = current; i < target; i++) addSolarSegment()
    } else if (target < current) {
      segments.slice(target).forEach((seg) => removeSolarSegment(seg.id))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Sun className="h-4 w-4 text-primary" />
          {label ?? 'Solcelleanlæg'}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Antal tag-flader</span>
          <div className="flex rounded-lg border border-border bg-muted p-0.5 text-sm">
            {Array.from({ length: MAX_SEGMENTS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSegmentCount(n)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  segments.length === n ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {segments.length > 1 && (
        <p className="text-sm text-muted-foreground -mt-2">
          I alt <span className="font-medium text-foreground">{totalKw.toFixed(1)} kWp</span> fordelt på {segments.length} tag-flader
        </p>
      )}

      <div className="space-y-5 divide-y divide-border">
        {segments.map((segment, i) => (
          <div key={segment.id} className={i > 0 ? 'pt-5' : undefined}>
            <RoofSegmentCard
              segment={segment}
              title={segments.length > 1 ? `Tag-flade ${i + 1}` : undefined}
              peakKwMin={1}
              peakKwMax={50}
              peakKwStep={0.5}
              onUpdate={(partial) => updateSolarSegment(segment.id, partial)}
            />
          </div>
        ))}
      </div>

      {advanced && (
        <SliderField
          label="Systemtab"
          value={solarConfig.systemLossPct}
          min={0}
          max={30}
          step={1}
          unit="%"
          description="Inkl. temperatur, kabelstab, vekselretter, snavs og degradering. 14% er PVGIS' realistiske standard."
          onChange={(v) => setSystemLossPct(v)}
        />
      )}
    </div>
  )
}
