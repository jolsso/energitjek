import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { sweepSystemSizes, findOptimalSize, M2_PER_KWP } from '@/lib/optimizer'
import type { SizeOption } from '@/lib/optimizer'

type Mode = 'budget' | 'area'

export function SizeOptimizerPanel() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('budget')
  const [budgetDkk, setBudgetDkk] = useState(60000)
  const [roofM2, setRoofM2] = useState(30)
  const [recommendation, setRecommendation] = useState<SizeOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pvgisData    = useAppStore(s => s.pvgisData)
  const solarConfig  = useAppStore(s => s.solarConfig)
  const investmentDkk = useAppStore(s => s.investmentDkk)
  const consumption  = useAppStore(s => s.consumption)
  const hourlyPrices = useAppStore(s => s.hourlyPrices)
  const setSolarConfig = useAppStore(s => s.setSolarConfig)

  if (!pvgisData) return null

  function calculate() {
    setError(null)
    setRecommendation(null)

    const pricePerKwp = investmentDkk / solarConfig.peakKw
    const maxKwp = mode === 'budget'
      ? Math.floor((budgetDkk / pricePerKwp) * 2) / 2
      : Math.floor((roofM2 / M2_PER_KWP) * 2) / 2

    if (maxKwp < 1) {
      setError(
        mode === 'budget'
          ? 'Budgettet er for lille til et anlæg på mindst 1 kWp.'
          : 'Arealet er for lille — der kræves mindst 6 m² pr. kWp.',
      )
      return
    }

    const options = sweepSystemSizes(
      pvgisData!,
      solarConfig.peakKw,
      investmentDkk,
      maxKwp,
      consumption,
      hourlyPrices ?? undefined,
    )
    const best = findOptimalSize(options)
    if (!best) {
      setError('Ingen rentabel størrelse fundet med de nuværende priser.')
      return
    }
    setRecommendation(best)
  }

  return (
    <div className="border-t border-border pt-4 mt-1">
      <button
        onClick={() => { setOpen(v => !v); setRecommendation(null); setError(null) }}
        className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" />
          Hjælp mig med størrelsen
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs">
            <button
              onClick={() => { setMode('budget'); setRecommendation(null); setError(null) }}
              className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                mode === 'budget' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Budget (kr)
            </button>
            <button
              onClick={() => { setMode('area'); setRecommendation(null); setError(null) }}
              className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                mode === 'area' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tagareal (m²)
            </button>
          </div>

          {/* Input slider */}
          {mode === 'budget' ? (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <label className="font-medium">Budget</label>
                <span className="text-muted-foreground">{budgetDkk.toLocaleString('da-DK')} kr</span>
              </div>
              <input
                type="range"
                min={10000}
                max={300000}
                step={5000}
                value={budgetDkk}
                onChange={e => { setBudgetDkk(parseInt(e.target.value)); setRecommendation(null); setError(null) }}
                className="w-full accent-primary"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <label className="font-medium">Tilgængeligt tagareal</label>
                <span className="text-muted-foreground">{roofM2} m²</span>
              </div>
              <input
                type="range"
                min={6}
                max={200}
                step={6}
                value={roofM2}
                onChange={e => { setRoofM2(parseInt(e.target.value)); setRecommendation(null); setError(null) }}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">Ca. {M2_PER_KWP} m² pr. kWp</p>
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, hsl(36 96% 48%) 0%, hsl(24 96% 52%) 100%)' }}
          >
            Find optimal størrelse
          </button>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {recommendation && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Anbefaling</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">{recommendation.peakKw} kWp</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(recommendation.annualSavedDkk).toLocaleString('da-DK')} kr/år
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Korteste tilbagebetalingstid: {recommendation.paybackYears.toFixed(1)} år
              </p>
              <button
                onClick={() => setSolarConfig({ peakKw: recommendation.peakKw })}
                className="w-full py-1.5 rounded-md border border-primary text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Anvend {recommendation.peakKw} kWp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
