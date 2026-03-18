import { Zap, ShieldCheck } from 'lucide-react'

interface Props {
  onPrivacy: () => void
}

export function Header({ onPrivacy }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight">Er du sunshine?</span>
          {import.meta.env.VITE_DEV_BADGE === 'true' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
              dev
            </span>
          )}
        </div>
        <button
          onClick={onPrivacy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Privatliv
        </button>
      </div>
    </header>
  )
}
