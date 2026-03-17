import { Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { PriceArea } from '@/lib/energidataservice'

const AREAS: { value: PriceArea; label: string }[] = [
  { value: 'DK1', label: 'DK1 — Vest (Jylland/Fyn)' },
  { value: 'DK2', label: 'DK2 — Øst (Sjælland/Bornholm)' },
]

export function PricingForm() {
  const { priceArea, setPriceArea } = useAppStore()

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Priszone
      </h2>

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

      <p className="text-xs text-muted-foreground">
        Bruges til at hente reelle spotpriser fra Energidataservice
      </p>
    </div>
  )
}
