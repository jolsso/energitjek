import { useState, useEffect, useRef } from 'react'
import { ConsumptionForm } from '@/components/forms/ConsumptionForm'
import { AddressForm } from '@/components/forms/AddressForm'
import { PricingForm } from '@/components/forms/PricingForm'
import { SolarConfigForm } from '@/components/forms/SolarConfigForm'
import { InvestmentForm } from '@/components/forms/InvestmentForm'
import { BatteryConfigForm } from '@/components/forms/BatteryConfigForm'
import { AddressMap } from '@/components/map/AddressMap'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { Header } from '@/components/layout/Header'
import { ComingSoon } from '@/components/ComingSoon'
import { useSimulation } from '@/hooks/useSimulation'
import { useAppStore } from '@/store/appStore'

export default function App() {
  const [step, setStep] = useState<'input' | 'results'>('input')
  const { runSimulation, isLoading, error } = useSimulation()
  const reset = useAppStore((s) => s.reset)
  const solarConfig = useAppStore((s) => s.solarConfig)
  const coordinates = useAppStore((s) => s.coordinates)
  const address = useAppStore((s) => s.address)

  // Always keep ref up-to-date so debounced callback never goes stale
  const runSimulationRef = useRef(runSimulation)
  runSimulationRef.current = runSimulation

  const handleCalculate = async () => {
    const ok = await runSimulation()
    if (ok) setStep('results')
  }

  // Auto re-simulate when solar config changes while on results page
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (step !== 'results') return
    const timer = setTimeout(() => { runSimulationRef.current() }, 700)
    return () => clearTimeout(timer)
  }, [solarConfig, step])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {step === 'input' ? (
          <div className="space-y-8">
            <div className="text-center space-y-3 mb-10">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground card-shadow mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                Gratis · Ingen login · Ingen sporing
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Beregn din{' '}
                <span className="text-primary">solcelleøkonomi</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                Indtast din adresse og forbrug — du kan justere solcelleanlægget live på næste trin.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <AddressForm />
                <ConsumptionForm />
              </div>
              <div className="space-y-4">
                <PricingForm />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2 pb-6">
              <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="px-10 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? 'Beregner…' : 'Beregn besparelse'}
              </button>
              <button
                onClick={reset}
                disabled={isLoading}
                className="px-5 py-3.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Nulstil
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('input')}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                ← Ret adresse og forbrug
              </button>
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Opdaterer simulering…
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
              {/* Sticky left sidebar — map + solar config + investment */}
              <div className="space-y-4 lg:sticky lg:top-20">
                {coordinates && (
                  <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{address}</p>
                    </div>
                    <AddressMap
                      coordinates={coordinates}
                      displayName={address}
                      azimuthDeg={solarConfig.azimuthDeg}
                    />
                  </div>
                )}
                <SolarConfigForm />
                <InvestmentForm />
                <ComingSoon phase="Phase 4" title="Batterisimulering">
                  <BatteryConfigForm />
                </ComingSoon>
              </div>

              {/* Results */}
              <div className="min-w-0">
                <ResultsPanel />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
