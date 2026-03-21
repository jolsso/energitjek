import { Zap, ShieldCheck, Github, Calculator } from 'lucide-react'

interface Props {
  onPrivacy: () => void
  onMethodology: () => void
}

export function Header({ onPrivacy, onMethodology }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-md" style={{ boxShadow: '0 1px 0 0 hsl(36 96% 48% / 0.15), 0 2px 8px 0 rgb(0 0 0 / 0.06)' }}>
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(36 96% 48%) 0%, hsl(24 96% 52%) 100%)', boxShadow: '0 2px 8px 0 hsl(36 96% 48% / 0.4)' }}>
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-base tracking-tight">Er du sunshine?</span>
          {import.meta.env.VITE_DEV_BADGE === 'true' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
              dev
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/jolsso/energitjek"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <button
            onClick={onMethodology}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Calculator className="h-3.5 w-3.5" />
            Metode
          </button>
          <button
            onClick={onPrivacy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Privatliv
          </button>
        </div>
      </div>
    </header>
  )
}
