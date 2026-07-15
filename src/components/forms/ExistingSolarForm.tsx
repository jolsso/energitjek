import { Sun } from 'lucide-react'
import { useAppStore, defaultExistingSolarConfig, MAX_SEGMENTS } from '@/store/appStore'
import { getSegmentPeakKw } from '@/lib/roofCapacity'
import { RoofSegmentCard } from './RoofSegmentCard'

export function ExistingSolarForm() {
  const existingSolarConfig    = useAppStore((s) => s.existingSolarConfig)
  const setExistingSolarConfig = useAppStore((s) => s.setExistingSolarConfig)
  const addExistingSegment     = useAppStore((s) => s.addExistingSegment)
  const removeExistingSegment  = useAppStore((s) => s.removeExistingSegment)
  const updateExistingSegment  = useAppStore((s) => s.updateExistingSegment)

  const enabled = existingSolarConfig !== null
  const config  = existingSolarConfig ?? defaultExistingSolarConfig()
  const segments = config.segments
  const totalKw = segments.reduce((sum, seg) => sum + getSegmentPeakKw(seg), 0)

  const toggle = () => setExistingSolarConfig(enabled ? null : defaultExistingSolarConfig())

  const setSegmentCount = (target: number) => {
    const current = segments.length
    if (target > current) {
      for (let i = current; i < target; i++) addExistingSegment()
    } else if (target < current) {
      segments.slice(target).forEach((seg) => removeExistingSegment(seg.id))
    }
  }

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
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700">Antal tag-flader</span>
            <div className="flex rounded-lg border border-amber-200 bg-amber-100/50 p-0.5 text-sm">
              {Array.from({ length: MAX_SEGMENTS }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setSegmentCount(n)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    segments.length === n ? 'bg-card shadow-sm text-amber-900' : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {segments.length > 1 && (
            <p className="text-sm text-amber-700">
              I alt <span className="font-medium text-amber-900">{totalKw.toFixed(1)} kWp</span> fordelt på {segments.length} tag-flader
            </p>
          )}

          <div className="space-y-4 divide-y divide-amber-200">
            {segments.map((segment, i) => (
              <div key={segment.id} className={i > 0 ? 'pt-4' : undefined}>
                <RoofSegmentCard
                  segment={segment}
                  title={segments.length > 1 ? `Tag-flade ${i + 1}` : undefined}
                  peakKwMin={0.5}
                  peakKwMax={30}
                  peakKwStep={0.5}
                  onUpdate={(partial) => updateExistingSegment(segment.id, partial)}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-700 border-t border-amber-200 pt-3">
            Simulationsformen nedenfor repræsenterer den <span className="font-medium">udvidelse</span> du ønsker at beregne oven i dit nuværende anlæg.
          </p>
        </>
      )}
    </div>
  )
}
