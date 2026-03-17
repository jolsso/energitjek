import { BatteryCharging } from 'lucide-react'

export function BatteryConfigForm() {
  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-5">
      <h2 className="font-semibold flex items-center gap-2">
        <BatteryCharging className="h-4 w-4 text-primary" />
        Batteri
      </h2>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label className="font-medium">Kapacitet</label>
          <span className="text-muted-foreground">10 kWh</span>
        </div>
        <input type="range" min={1} max={30} defaultValue={10} className="w-full accent-primary" />
        <p className="text-xs text-muted-foreground">Batteriets brugbare kapacitet</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label className="font-medium">Max. effekt (lade/aflade)</label>
          <span className="text-muted-foreground">5 kW</span>
        </div>
        <input type="range" min={1} max={20} defaultValue={5} className="w-full accent-primary" />
        <p className="text-xs text-muted-foreground">Maks. lade- og afladeveffekt</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Strategi</label>
        <div className="grid grid-cols-1 gap-1.5 mt-1">
          {[
            { id: 'self', label: 'Egenforbrug', desc: 'Gem overskud til aftenforbrug' },
            { id: 'peak', label: 'Peak-shaving', desc: 'Reducer spidsbelastning' },
            { id: 'tou',  label: 'Time-of-use',  desc: 'Optimer efter timepris' },
          ].map(({ id, label, desc }) => (
            <label key={id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 cursor-pointer">
              <input
                type="radio"
                name="battery-strategy"
                defaultChecked={id === 'self'}
                className="mt-0.5 accent-primary shrink-0"
              />
              <div>
                <p className="text-sm font-medium leading-none">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
