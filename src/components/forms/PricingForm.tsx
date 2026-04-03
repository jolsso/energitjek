import { Zap, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { dsoFromPostcode, dsoFromGln } from '@/lib/gridtariff'

export function PricingForm() {
  const { postcode, eloverblikDsoGln, fixedSpotDkk, setFixedSpotDkk } = useAppStore()
  const dso = eloverblikDsoGln
    ? (dsoFromGln(eloverblikDsoGln) ?? { glnNumber: eloverblikDsoGln, name: `Netselskab (GLN: ${eloverblikDsoGln})` })
    : (postcode ? dsoFromPostcode(postcode) : null)
  const dsoSource = eloverblikDsoGln ? 'eloverblik' : 'postcode'

  const fixedEnabled = fixedSpotDkk !== null
  const oreValue = fixedEnabled ? Math.round(fixedSpotDkk * 100) : 60

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        Priser
      </h2>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Netselskab</label>
          {dso && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {dsoSource === 'eloverblik' ? 'Fra Eloverblik' : 'Auto-registreret'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {dso ? dso.name : 'Bestemmes automatisk fra postnummer'}
          </span>
        </div>
        {dso && (
          <p className="text-xs text-muted-foreground">
            {dsoSource === 'eloverblik'
              ? 'Præcist netselskab hentet fra dit målepunkt.'
              : 'Timebaseret nettarif hentes automatisk til simuleringen.'}
          </p>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Fast spotpris</p>
            <p className="text-xs text-muted-foreground">Tilsidesæt timebaserede spotpriser</p>
          </div>
          <button
            onClick={() => setFixedSpotDkk(fixedEnabled ? null : oreValue / 100)}
            role="switch"
            aria-checked={fixedEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              fixedEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                fixedEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {fixedEnabled && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <label className="font-medium">Spotpris</label>
              <span className="text-muted-foreground">{oreValue} øre/kWh</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              step={5}
              value={oreValue}
              onChange={(e) => setFixedSpotDkk(Number(e.target.value) / 100)}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Ekskl. moms og afgifter · Dansk gennemsnit: ~60–80 øre/kWh
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
