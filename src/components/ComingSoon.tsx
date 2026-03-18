interface Props {
  phase: string
  title: string
  children: React.ReactNode
}

export function ComingSoon({ phase, children }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{phase}</span>
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Kommer snart
        </span>
      </div>
      <div
        className="opacity-40 pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  )
}
