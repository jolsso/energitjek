import { useState, useEffect, useRef } from 'react'
import { ConsumptionForm } from '@/components/forms/ConsumptionForm'
import { AddressForm } from '@/components/forms/AddressForm'
import { PricingForm } from '@/components/forms/PricingForm'
import { SolarConfigForm } from '@/components/forms/SolarConfigForm'
import { InvestmentForm } from '@/components/forms/InvestmentForm'
import { BatteryConfigForm } from '@/components/forms/BatteryConfigForm'
import { ExistingSolarForm } from '@/components/forms/ExistingSolarForm'
import { EloverblikSetupForm } from '@/components/forms/EloverblikSetupForm'
import { AddressMap } from '@/components/map/AddressMap'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { Header } from '@/components/layout/Header'
import { PrivacyPage } from '@/components/PrivacyPage'
import { useSimulation } from '@/hooks/useSimulation'
import { useAppStore } from '@/store/appStore'

type InputMode = 'eloverblik' | 'manual'

export default function App() {
  const [step, setStep] = useState<'input' | 'results' | 'privacy'>('input')
  const [inputMode, setInputMode] = useState<InputMode>('eloverblik')
  const { runSimulation, isLoading, error } = useSimulation()
  const reset = useAppStore((s) => s.reset)
  const solarConfig = useAppStore((s) => s.solarConfig)
  const batteryConfig = useAppStore((s) => s.batteryConfig)
  const existingSolarConfig = useAppStore((s) => s.existingSolarConfig)
  const consumption = useAppStore((s) => s.consumption)
  const coordinates = useAppStore((s) => s.coordinates)
  const address = useAppStore((s) => s.address)

  // Always keep ref up-to-date so debounced callback never goes stale
  const runSimulationRef = useRef(runSimulation)
  // eslint-disable-next-line react-hooks/refs
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
  }, [solarConfig, batteryConfig, existingSolarConfig, step])

  return (
    <div className="min-h-screen bg-background">
      <Header onPrivacy={() => setStep('privacy')} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {step === 'privacy' ? (
          <PrivacyPage onBack={() => setStep('input')} />
        ) : step === 'input' ? (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground card-shadow mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                Gratis · Ingen login · Ingen sporing
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Beregn din{' '}
                <span className="text-primary">solcelleøkonomi</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                Hent alt automatisk via Eloverblik, eller konfigurer selv.
              </p>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
              {([
                {
                  id: 'eloverblik' as InputMode,
                  title: 'Via Eloverblik',
                  badge: 'Anbefalet',
                  desc: 'Adresse, forbrug og priszone hentes automatisk fra din elmåler.',
                },
                {
                  id: 'manual' as InputMode,
                  title: 'Manuel',
                  badge: null,
                  desc: 'Angiv adresse, forbrug og priszone selv.',
                },
              ] as const).map(({ id, title, badge, desc }) => (
                <button
                  key={id}
                  onClick={() => setInputMode(id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    inputMode === id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{title}</span>
                    {badge && (
                      <span className="rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                </button>
              ))}
            </div>

            {/* Mode content */}
            {inputMode === 'eloverblik' ? (
              <div className="max-w-xl mx-auto space-y-4">
                <EloverblikSetupForm />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <AddressForm />
                  <ConsumptionForm />
                </div>
                <div className="space-y-4">
                  <PricingForm />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2 pb-6">
              <button
                onClick={handleCalculate}
                disabled={isLoading || !coordinates}
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
              <div className="space-y-4 lg:sticky lg:top-20 order-2 lg:order-1">
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
                {(consumption.hasExport || existingSolarConfig) && <ExistingSolarForm />}
                <SolarConfigForm label={(consumption.hasExport || existingSolarConfig) ? 'Simuleret udvidelse' : undefined} />
                <InvestmentForm />
                <BatteryConfigForm />
              </div>

              {/* Results */}
              <div className="min-w-0 order-1 lg:order-2">
                <ResultsPanel />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
