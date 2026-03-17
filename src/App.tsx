import { useState } from 'react'
import { SolarConfigForm } from '@/components/forms/SolarConfigForm'
import { ConsumptionForm } from '@/components/forms/ConsumptionForm'
import { AddressForm } from '@/components/forms/AddressForm'
import { PricingForm } from '@/components/forms/PricingForm'
import { InvestmentForm } from '@/components/forms/InvestmentForm'
import { ResultsPanel } from '@/components/results/ResultsPanel'
import { Header } from '@/components/layout/Header'
import { useSimulation } from '@/hooks/useSimulation'

export default function App() {
  const [step, setStep] = useState<'input' | 'results'>('input')
  const { runSimulation, isLoading, error } = useSimulation()

  const handleCalculate = async () => {
    const ok = await runSimulation()
    if (ok) setStep('results')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
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
                Indtast din adresse og solcelleanlæggets specifikationer for at
                se, hvad du kan spare.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <AddressForm />
                <ConsumptionForm />
                <PricingForm />
                <InvestmentForm />
              </div>
              <SolarConfigForm />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="group relative px-10 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? 'Beregner…' : 'Beregn besparelse'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep('input')}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                ← Ret indstillinger
              </button>
            </div>
            <ResultsPanel />
          </div>
        )}
      </main>
    </div>
  )
}
