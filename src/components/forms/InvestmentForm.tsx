import { PiggyBank } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function InvestmentForm() {
  const { investmentDkk, setInvestmentDkk } = useAppStore()

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <PiggyBank className="h-4 w-4 text-primary" />
        Investering
      </h2>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label htmlFor="investment" className="font-medium">
            Anlægsomkostning
          </label>
          <span className="text-muted-foreground">
            {investmentDkk > 0
              ? investmentDkk.toLocaleString('da-DK') + ' kr.'
              : '—'}
          </span>
        </div>
        <input
          id="investment"
          type="range"
          min={0}
          max={200000}
          step={1000}
          value={investmentDkk}
          onChange={(e) => setInvestmentDkk(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Ikke angivet</span>
          <span>200.000 kr.</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Typisk 6 kWp: 80.000–120.000 kr. inkl. montering og inverter
        </p>
      </div>
    </div>
  )
}
