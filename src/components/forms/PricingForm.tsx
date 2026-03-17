import { Zap, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { PriceArea } from '@/lib/energidataservice'
import { dsoFromPostcode } from '@/lib/gridtariff'

const AREAS: { value: PriceArea; label: string }[] = [
  { value: 'DK1', label: 'DK1 — Vest (Jylland/Fyn)' },
  { value: 'DK2', label: 'DK2 — Øst (Sjælland/Bornholm)' },
]

export function PricingForm() {
  const { priceArea, setPriceArea, postcode, coordinates } = useAppStore()
  const dso = postcode ? dsoFromPostcode(postcode) : null

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Priszone
        </h2>
        {coordinates && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Auto-registreret
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {AREAS.map((area) => {
          const isSelected = priceArea === area.value
          return (
            <button
              key={area.value}
              type="button"
              onClick={() => setPriceArea(area.value)}
              className={
                isSelected
                  ? 'flex-1 rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground transition-colors'
                  : 'flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors'
              }
            >
              {area.label}
            </button>
          )
        })}
      </div>

      {dso ? (
        <p className="text-xs text-muted-foreground">
          Netselskab: <span className="font-medium text-foreground">{dso.name}</span>
          {' — '}reelle timebaserede nettariffer hentes automatisk.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Bestemmes automatisk fra postnummer. Du kan overskrive manuelt.
        </p>
      )}
    </div>
  )
}
