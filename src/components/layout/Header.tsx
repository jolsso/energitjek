import { Sun } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Sun className="h-5 w-5 text-primary" />
          <span>Energitjek</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Dine data forlader ikke din browser
        </span>
      </div>
    </header>
  )
}
