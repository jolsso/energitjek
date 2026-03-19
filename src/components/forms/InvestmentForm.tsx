import { PiggyBank } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const PRESETS = [
  { label: '60k',  value: 60000 },
  { label: '80k',  value: 80000 },
  { label: '100k', value: 100000 },
  { label: '120k', value: 120000 },
  { label: '150k', value: 150000 },
]

export function InvestmentForm() {
  const { investmentDkk, setInvestmentDkk } = useAppStore()

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <PiggyBank className="h-4 w-4 text-primary" />
        Investering
      </h2>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ label, value }) => {
            const active = investmentDkk === value
            return (
              <button
                key={value}
                onClick={() => setInvestmentDkk(active ? 0 : value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

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
            max={400000}
            step={1000}
            value={investmentDkk}
            onChange={(e) => setInvestmentDkk(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ikke angivet</span>
            <span>400.000 kr.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Typisk 6 kWp anlæg koster 80.000–120.000 kr. inkl. montering
          </p>
        </div>
      </div>
    </div>
  )
}
