import { useState } from 'react'
import { SolarConfigForm } from '@/components/forms/SolarConfigForm'
import { ConsumptionForm } from '@/components/forms/ConsumptionForm'
import { AddressForm } from '@/components/forms/AddressForm'
import { PricingForm } from '@/components/forms/PricingForm'
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
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                Beregn din solcelleøkonomi
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Indtast din adresse og solcelleanlæggets specifikationer for at
                se, hvad du kan spare.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <AddressForm />
                <ConsumptionForm />
                <PricingForm />
              </div>
              <SolarConfigForm />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
