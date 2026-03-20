import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'

interface Props {
  investmentDkk: number
  annualSavedDkk: number
}

const PANEL_LIFETIME = 25  // years

function buildData(investmentDkk: number, annualSavedDkk: number) {
  return Array.from({ length: PANEL_LIFETIME + 1 }, (_, year) => ({
    year,
    netto: Math.round(-investmentDkk + annualSavedDkk * year),
  }))
}

function paybackYear(investmentDkk: number, annualSavedDkk: number): number | null {
  if (annualSavedDkk <= 0) return null
  const y = investmentDkk / annualSavedDkk
  return y <= PANEL_LIFETIME ? y : null
}

function formatDkk(v: number) {
  return v.toLocaleString('da-DK', { maximumFractionDigits: 0 }) + ' kr.'
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const netto = payload[0]?.value as number
  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-3 text-xs shadow-md min-w-[150px] space-y-1">
      <p className="font-semibold text-sm">År {label}</p>
      <div className={`flex justify-between gap-4 font-medium ${netto >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        <span>Kumulativ netto</span>
        <span>{netto >= 0 ? '+' : ''}{formatDkk(netto)}</span>
      </div>
    </div>
  )
}

export function PaybackChart({ investmentDkk, annualSavedDkk }: Props) {
  const data = buildData(investmentDkk, annualSavedDkk)
  const pb   = paybackYear(investmentDkk, annualSavedDkk)

  const minVal  = -investmentDkk
  const maxVal  = Math.round(-investmentDkk + annualSavedDkk * PANEL_LIFETIME)
  const yDomain: [number, number] = [Math.min(minVal, 0), Math.max(maxVal, 0)]

  return (
    <div className="rounded-xl border border-border bg-card card-shadow p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Tilbagebetalingsperiode</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pb != null
            ? `Anlægget betaler sig tilbage efter ca. ${pb.toFixed(1).replace('.', ',')} år — herefter er det ren gevinst.`
            : `Tilbagebetalingstiden overstiger ${PANEL_LIFETIME} år med det angivne investeringsbeløb. Justér beløbet nedenfor for at se break-even.`}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="paybackGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(142,71%,40%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(142,71%,40%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="paybackGradientNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(0,72%,58%)" stopOpacity={0.05} />
              <stop offset="95%" stopColor="hsl(0,72%,58%)" stopOpacity={0.25} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'År', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
            domain={yDomain}
            tickFormatter={(v: number) =>
              (v / 1000).toFixed(0) + 'k kr.'
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />

          {/* Breakeven line */}
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />

          {/* Payback year marker */}
          {pb != null && (
            <ReferenceLine
              x={Math.round(pb)}
              stroke="hsl(142,71%,40%)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: `År ${Math.round(pb)}`, position: 'insideTopRight', fontSize: 11, fill: 'hsl(142,71%,40%)' }}
            />
          )}

          {/* Area below zero (deficit) */}
          <Area
            type="monotone"
            dataKey="netto"
            stroke="none"
            fill="url(#paybackGradientNeg)"
            fillOpacity={1}
            activeDot={false}
            baseValue={0}
          />

          {/* Main line + area above zero (profit) */}
          <Area
            type="monotone"
            dataKey="netto"
            stroke="hsl(142,71%,40%)"
            strokeWidth={2}
            fill="url(#paybackGradient)"
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
