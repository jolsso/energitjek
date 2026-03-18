import { Zap } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight">Er du sunshine?</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          Dine data forlader ikke din browser
        </span>
      </div>
    </header>
  )
}
