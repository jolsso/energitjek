import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { ConsumptionForm } from '@/components/forms/ConsumptionForm'
import { AddressForm } from '@/components/forms/AddressForm'
import { PricingForm } from '@/components/forms/PricingForm'
import { SolarConfigForm } from '@/components/forms/SolarConfigForm'
import { BatteryConfigForm } from '@/components/forms/BatteryConfigForm'
import { ConsumptionAddonsForm } from '@/components/forms/ConsumptionAddonsForm'
import { ExistingSolarForm } from '@/components/forms/ExistingSolarForm'
import { EloverblikSetupForm } from '@/components/forms/EloverblikSetupForm'
import { AddressMap } from '@/components/map/AddressMap'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { Header } from '@/components/layout/Header'
import { PrivacyPage } from '@/components/PrivacyPage'
import { MethodologyPage } from '@/components/MethodologyPage'
import { useSimulation } from '@/hooks/useSimulation'
import { useAppStore } from '@/store/appStore'
import type { Coordinates } from '@/types'

type Overlay = 'privacy' | 'methodology' | null

export default function App() {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [advanced, setAdvanced] = useState(false)
  const [eloverblikOpen, setEloverblikOpen] = useState(false)

  const { runSimulation, isLoading, error } = useSimulation()
  const reset = useAppStore((s) => s.reset)
  const solarConfig = useAppStore((s) => s.solarConfig)
  const batteryConfig = useAppStore((s) => s.batteryConfig)
  const heatpumpEnabled = useAppStore((s) => s.heatpumpEnabled)
  const evKmPerDay = useAppStore((s) => s.evKmPerDay)
  const existingSolarConfig = useAppStore((s) => s.existingSolarConfig)
  const consumption = useAppStore((s) => s.consumption)
  const coordinates = useAppStore((s) => s.coordinates)
  const address = useAppStore((s) => s.address)
  const simulationResult = useAppStore((s) => s.simulationResult)

  // Always keep ref up-to-date so debounced callbacks never go stale
  const runSimulationRef = useRef(runSimulation)
  // eslint-disable-next-line react-hooks/refs
  runSimulationRef.current = runSimulation

  // Auto-simulate when coordinates first become available (address searched)
  const prevCoords = useRef<Coordinates | null>(coordinates)
  useEffect(() => {
    const prev = prevCoords.current
    prevCoords.current = coordinates
    // Only trigger when transitioning null → non-null and no results yet
    if (prev === null && coordinates !== null && !simulationResult) {
      runSimulationRef.current()
    }
  }, [coordinates, simulationResult])

  // Auto re-simulate when solar/battery/addon config changes while results exist
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!simulationResult) return
    const timer = setTimeout(() => { runSimulationRef.current() }, 700)
    return () => clearTimeout(timer)
  }, [solarConfig, batteryConfig, heatpumpEnabled, evKmPerDay, existingSolarConfig, simulationResult])

  // Privacy / Methodology overlays (full-page, same shell)
  if (overlay === 'privacy') {
    return (
      <div className="min-h-screen bg-background">
        <Header onPrivacy={() => setOverlay(null)} onMethodology={() => setOverlay('methodology')} />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <PrivacyPage onBack={() => setOverlay(null)} />
        </main>
      </div>
    )
  }
  if (overlay === 'methodology') {
    return (
      <div className="min-h-screen bg-background">
        <Header onPrivacy={() => setOverlay('privacy')} onMethodology={() => setOverlay(null)} />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <MethodologyPage onBack={() => setOverlay(null)} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPrivacy={() => setOverlay('privacy')} onMethodology={() => setOverlay('methodology')} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {!simulationResult ? (

          /* ── INPUT PHASE ── */
          <div className="space-y-8">

            {/* Hero */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 card-shadow mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block animate-pulse" />
                Gratis · Ingen login · Ingen sporing
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Beregn din{' '}
                <span className="gradient-text">solcelleøkonomi</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                Angiv din adresse — beregningen starter automatisk.
              </p>
            </div>

            {/* Input forms */}
            <div className="max-w-xl mx-auto space-y-4">
              <AddressForm />
              <ConsumptionForm />

              {/* Eloverblik — precision data, opt-in */}
              <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
                <button
                  onClick={() => setEloverblikOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(36 96% 48%) 0%, hsl(24 96% 52%) 100%)' }}
                    >
                      <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Hent data fra Eloverblik</p>
                      <p className="text-xs text-muted-foreground">Adresse, forbrug og priszone hentes automatisk</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[10px] font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5">
                      Mere præcist
                    </span>
                    {eloverblikOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </button>
                {eloverblikOpen && (
                  <div className="border-t border-border p-4">
                    <EloverblikSetupForm embedded />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="max-w-xl mx-auto rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading / CTA */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Henter soldata og beregner…</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 pt-2 pb-6">
                <button
                  onClick={runSimulation}
                  disabled={isLoading || !coordinates}
                  className="px-10 py-3.5 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(36 96% 48%) 0%, hsl(24 96% 52%) 100%)',
                    boxShadow: (!isLoading && coordinates)
                      ? '0 4px 20px 0 hsl(36 96% 48% / 0.45), 0 2px 4px 0 rgb(0 0 0 / 0.1)'
                      : undefined,
                  }}
                >
                  Beregn besparelse
                </button>
                <button
                  onClick={reset}
                  disabled={isLoading}
                  className="px-5 py-3.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Nulstil
                </button>
              </div>
            )}
          </div>

        ) : (

          /* ── RESULTS PHASE ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                ← Ny beregning
              </button>
              <div className="flex items-center gap-3">
                {isLoading && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Opdaterer simulering…
                  </span>
                )}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-sm">
                  <button
                    onClick={() => setAdvanced(false)}
                    className={`rounded-md px-3 py-1 font-medium transition-colors ${
                      !advanced ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setAdvanced(true)}
                    className={`rounded-md px-3 py-1 font-medium transition-colors ${
                      advanced ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Avanceret
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
              {/* Sticky left sidebar */}
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
                <SolarConfigForm
                  label={(consumption.hasExport || existingSolarConfig) ? 'Simuleret udvidelse' : undefined}
                  advanced={advanced}
                />
                {(consumption.hasExport || existingSolarConfig) && <ExistingSolarForm advanced={advanced} />}
                <ConsumptionAddonsForm />
                <BatteryConfigForm advanced={advanced} />
                <PricingForm />
              </div>

              {/* Results */}
              <div className="min-w-0 order-1 lg:order-2">
                <ResultsPanel advanced={advanced} />
              </div>
            </div>
          </div>

        )}
      </main>
    </div>
  )
}
