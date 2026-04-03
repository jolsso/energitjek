import {
  ArrowLeft,
  Calculator,
  Sun,
  Zap,
  Activity,
  TrendingDown,
  BatteryCharging,
  Car,
  RefreshCw,
  Leaf,
  BarChart2,
} from 'lucide-react'

interface Props {
  onBack: () => void
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-2">
        <Icon className="h-5 w-5 text-primary shrink-0" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function Formula({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-lg bg-muted border border-border px-4 py-3 font-mono text-sm space-y-1 overflow-x-auto">
      {lines.map((line, i) => (
        <div key={i} className={line.startsWith('//') ? 'text-muted-foreground text-xs' : 'text-foreground'}>
          {line}
        </div>
      ))}
    </div>
  )
}

function PipelineNode({
  label,
  sub,
  variant = 'default',
}: {
  label: string
  sub?: string
  variant?: 'default' | 'primary' | 'amber' | 'blue' | 'green'
}) {
  const styles: Record<string, string> = {
    default:  'border-border bg-card',
    primary:  'border-primary/50 bg-primary/5',
    amber:    'border-amber-300 bg-amber-50/60 dark:bg-amber-950/20',
    blue:     'border-blue-300 bg-blue-50/60 dark:bg-blue-950/20',
    green:    'border-green-300 bg-green-50/60 dark:bg-green-950/20',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 text-center text-xs ${styles[variant]}`}>
      <div className="font-semibold text-foreground leading-tight">{label}</div>
      {sub && <div className="text-muted-foreground mt-0.5 leading-tight">{sub}</div>}
    </div>
  )
}

function DownArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 my-0.5">
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
      <svg width="16" height="12" viewBox="0 0 16 12" className="text-muted-foreground">
        <line x1="8" y1="0" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="4,6 8,12 12,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function MethodologyPage({ onBack }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbage
      </button>

      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Metode og beregninger
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Alle beregninger er timebaserede — 8.760 timer pr. år — og bygger på offentlige datakilder. Her forklarer vi præcist hvilke data vi henter, og hvordan de kombineres til de tal du ser i resultaterne.
        </p>
      </div>

      {/* ── 1. Pipeline ─────────────────────────────── */}
      <Section icon={Activity} title="Beregningspipeline">
        <p className="text-sm text-muted-foreground">
          Fra adresse og anlægskonfiguration til endelig økonomi sker beregningen i fem trin der kører parallelt og samles i én timesimulation.
        </p>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-3 gap-4 text-xs">

            {/* Column 1 — production path */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Produktion</div>
              <PipelineNode label="Adresse" sub="Tekst-input" variant="default" />
              <DownArrow label="Nominatim" />
              <PipelineNode label="Koordinater" sub="lat / lon" />
              <DownArrow label="PVGIS API" />
              <PipelineNode label="Solproduktion" sub="8.760 W-værdier" variant="amber" />
            </div>

            {/* Column 2 — merge & simulate */}
            <div className="flex flex-col items-center justify-end gap-1.5 pb-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1 text-center">Simulation</div>
              {/* spacer to push simulation block down */}
              <div className="flex-1" />
              {/* horizontal merge arrows */}
              <div className="flex items-center gap-1 text-muted-foreground text-lg w-full justify-center">
                <span className="text-sm">→</span>
                <div className="rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5 text-center flex-1">
                  <div className="font-semibold text-sm text-foreground">Timesimulation</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">8.760 iterationer</div>
                </div>
                <span className="text-sm">←</span>
              </div>
              <DownArrow />
              <PipelineNode label="Resultater" sub="Økonomi · CO₂ · Payback" variant="green" />
            </div>

            {/* Column 3 — consumption + prices */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Forbrug + Priser</div>
              <PipelineNode label="Eloverblik / Manuel" sub="Forbrug" variant="blue" />
              <DownArrow label="Timeprofil" />
              <PipelineNode label="Forbrug" sub="kWh pr. time" />
              <DownArrow label="Energidataservice" />
              <PipelineNode label="Spotpriser + Tariffer" sub="DKK pr. time" />
            </div>

          </div>
        </div>
      </Section>

      {/* ── 2. PVGIS ────────────────────────────────── */}
      <Section icon={Sun} title="Solproduktion — PVGIS">
        <p className="text-sm text-muted-foreground">
          PVGIS (Photovoltaic Geographical Information System) vedligeholdes af EU-Kommissionens Joint Research Centre og leverer historisk timebaseret solproduktion baseret på satellitmålte solindfaldsdata fra et typisk meteorologisk år (TMY).
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="font-medium text-foreground">Parametre vi sender</div>
            <ul className="space-y-1 text-muted-foreground leading-relaxed">
              <li><span className="text-orange-500 font-medium">→</span> Latitude/longitude</li>
              <li><span className="text-orange-500 font-medium">→</span> Toppeffekt (kWp)</li>
              <li><span className="text-orange-500 font-medium">→</span> Hælding (0–90°)</li>
              <li><span className="text-orange-500 font-medium">→</span> Azimut (-180° til 180°)</li>
              <li><span className="text-orange-500 font-medium">→</span> Systemtab (%)</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="font-medium text-foreground">Vi modtager</div>
            <ul className="space-y-1 text-muted-foreground leading-relaxed">
              <li><span className="text-green-600 font-medium">←</span> AC-effekt i W (P) pr. time</li>
              <li><span className="text-green-600 font-medium">←</span> Global irradians (G_i) W/m²</li>
              <li><span className="text-green-600 font-medium">←</span> Lufttemperatur (T2m) °C</li>
              <li><span className="text-green-600 font-medium">←</span> 8.760 rækker (ét år)</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Da PVGIS returnerer gennemsnitlig effekt pr. time (W), svarer divisionen med 1.000 direkte til energi (kWh pr. time).
        </p>
        <Formula lines={[
          'produktion[h] = P[h] / 1000',
          '// W gennemsnit pr. time → kWh pr. time',
        ]} />
      </Section>

      {/* ── 3. Consumption ──────────────────────────── */}
      <Section icon={Zap} title="Forbrugsprofil">
        <p className="text-sm text-muted-foreground">
          Simuleringen kræver timebaseret forbrug. Vi understøtter to kilder med meget forskellig præcision:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="font-medium">Manuel input</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Det angivne årstal skaleres ned på en normeret dansk husstandsprofil med morgen- og aftenpeak. Profilen er baseret på Energinets aggregerede forbrugsdata og summerer præcist til det angivne kWh-tal.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="font-medium">Eloverblik</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Faktiske timemålinger fra din elmåler hentes direkte via Eloverblik API'et. Det giver en præcis profil der afspejler din husstands faktiske adfærd — inkl. sæsonvariation, daglige rutiner og specielle forbrugsmønstre.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground">Forbrugstillæg (oven på basisforbruget)</div>
          <div><span className="font-medium text-foreground">Varmepumpe</span> — tilføjer +6.500 kWh/år med en normeret varmepumpeprofil (morgen- og eftermiddagspeak, reduceret om sommeren).</div>
          <div><span className="font-medium text-foreground">El-bil</span> — dagligt energibehov placeres i de billigste timer kl. 21–06 (se nedenfor).</div>
        </div>
      </Section>

      {/* ── 4. Hourly simulation ────────────────────── */}
      <Section icon={Calculator} title="Timesimulation — energibalance">
        <p className="text-sm text-muted-foreground">
          For hver af årets 8.760 timer beregnes energibalancen og den tilhørende økonomi. Resultatet er et array med 8.760 timeindgange som opsummeres til de nøgletal du ser.
        </p>

        {/* Energy balance diagram */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="text-xs font-medium text-muted-foreground text-center">Energibalance pr. time</div>
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            <div className="space-y-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 dark:bg-amber-950/30 dark:border-amber-800">
                <div className="font-semibold text-amber-800 dark:text-amber-300">Solproduktion</div>
                <div className="text-amber-600 dark:text-amber-400 font-mono mt-0.5">P[h] kWh</div>
              </div>
              <div className="text-muted-foreground font-medium">+</div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 dark:bg-blue-950/30 dark:border-blue-800">
                <div className="font-semibold text-blue-800 dark:text-blue-300">Batteri ud</div>
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">hvis SOC &gt; 0</div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>→</span>
                <div className="rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-center">
                  <div className="font-semibold text-primary text-sm">Forbrug</div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">C[h] kWh</div>
                </div>
                <span>←</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-2.5 dark:bg-green-950/30 dark:border-green-800">
                <div className="font-semibold text-green-800 dark:text-green-300">Egenforbrug</div>
                <div className="font-mono text-green-600 dark:text-green-400 mt-0.5">min(P, C)</div>
              </div>
              <div className="text-muted-foreground font-medium">→ / ←</div>
              <div className="rounded-lg border border-border bg-muted/50 p-2.5">
                <div className="font-semibold text-muted-foreground">Net</div>
                <div className="text-muted-foreground mt-0.5">eksport / import</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Formula lines={[
            'egenforbrug[h]  = min(produktion[h], forbrug[h])',
            'overskud[h]     = max(0, produktion[h] − forbrug[h])   // → batteri → net',
            'underskud[h]    = max(0, forbrug[h] − produktion[h])   // ← batteri ← net',
          ]} />
        </div>
      </Section>

      {/* ── 5. Savings ──────────────────────────────── */}
      <Section icon={TrendingDown} title="Besparelsesberegning">
        <p className="text-sm text-muted-foreground">
          Besparelsen pr. time er summen af tre komponenter. Alle tre indgår i årsresultatet.
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">1 — Undgået spotomkostning</span>
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">Dominerende post</span>
            </div>
            <Formula lines={[
              'spotBesparelse[h] = egenforbrug[h] × spotpris[h] × 1,25',
              '// spotpris: EUR/MWh → DKK/kWh, moms: ×1,25',
            ]} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="text-sm font-medium">2 — Undgået nettarif</div>
            <Formula lines={[
              'tarifBesparelse[h] = egenforbrug[h] × (nettarif[h] + elafgift + systemtarif)',
              '// elafgift: 0,697 kr/kWh  |  systemtarif: 0,054 kr/kWh',
              '// nettarif: timebaseret, bestemt af dit netselskab (fra postnummer)',
            ]} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="text-sm font-medium">3 — Salg til net (feed-in)</div>
            <Formula lines={[
              'feedIn[h] = neteksport[h] × spotpris[h] × 0,77',
              '// Danmark har ikke fuld nettomåling — overskud sælges til spotpris',
              '// minus nettariffer (konservativt estimat: ~77 % af spot)',
            ]} />
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs text-muted-foreground">
          besparelse[h] = spotBesparelse[h] + tarifBesparelse[h] + feedIn[h]
        </div>
      </Section>

      {/* ── 6. Battery ──────────────────────────────── */}
      <Section icon={BatteryCharging} title="Batterisimulation">
        <p className="text-sm text-muted-foreground">
          Batteriet modelleres med en tilstandsvariabel SOC (State of Charge) i kWh. Round-trip-effektiviteten (typisk 90 %) fordeles symmetrisk på lade- og afladefasen.
        </p>
        <Formula lines={[
          'η_half  = √(roundTripEffektivitet / 100)     // fx √0,90 ≈ 0,949',
          '',
          '// Ladning (solproduktionsoverskud → batteri)',
          'SOC += ladekWh × η_half',
          '',
          '// Afladning (batteri → last)',
          'SOC −= afladekWh / η_half',
        ]} />
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            {
              label: 'Egenforbrug',
              desc: 'Overskudsproduktion lades i batteriet. Afladning aktiveres i alle timer med underskud.',
            },
            {
              label: 'Peak-shaving',
              desc: 'Som egenforbrug, men afladning prioriteres i timer med høj nettarif for at reducere spidsbelastning.',
            },
            {
              label: 'Time-of-use',
              desc: 'Afladning aktiveres kun når spotprisen er højere end daglig gennemsnitspris — batteriet spares til dyre timer.',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
              <div className="font-medium">{s.label}</div>
              <div className="text-muted-foreground leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 7. EV ───────────────────────────────────── */}
      <Section icon={Car} title="El-bil — smart natopladning">
        <p className="text-sm text-muted-foreground">
          El-bilens daglige energibehov beregnes som km/dag × 0,2 kWh/km. Behovet fordeles grådigt på de billigste timer i opladningsvinduet kl. 21–06.
        </p>
        <Formula lines={[
          'dagligKwh       = kmPerDay × 0,2',
          'kandidatTimer   = [21, 22, 23, 00, 01, 02, 03, 04, 05]',
          '                  sorteret stigende efter spotpris',
          'maxLadePower    = 11 kW pr. time  (Type-2 wallbox, 16A)',
          '',
          '// Grådigt udfyld fra billigste time:',
          'for each time in kandidatTimer:',
          '    charge = min(restBehov, maxLadePower)',
          '    profil[time] += charge',
        ]} />
        <p className="text-xs text-muted-foreground">
          EV-forbruget tæller med i det samlede forbrug i simuleringen. Dagsproduktionen fra solcellerne reducerer dermed indirekte net-importen om natten ved at forbedre selvforbrugsprocenten.
        </p>
      </Section>

      {/* ── 8. Existing solar reconstruction ────────── */}
      <Section icon={RefreshCw} title="Eksisterende anlæg — forbrugrekonstruktion">
        <p className="text-sm text-muted-foreground">
          Brugere med eksisterende solceller ser nettomåledata i Eloverblik (grid import minus soleksport) — ikke bruttoforbruget. For at simulere en udvidelse korrekt rekonstruerer vi bruttoforbruget time for time:
        </p>
        <Formula lines={[
          '// E17-måler: import fra net  |  E18-måler: eksport til net',
          'brutto[h] = import[h] + pvgisEksisterende[h] − eksport[h]',
          'brutto[h] = max(0, brutto[h])   // clamp: undgå negative ved modelfejl',
        ]} />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">pvgisEksisterende[h]</span> — PVGIS-modelleret timeproduktion for det eksisterende anlæg, hentet parallelt med det nye anlægs PVGIS-kald. Bruttoforbruget bruges derefter som forbrugsprofil i simuleringen af det kombinerede system (eksisterende + udvidelse).
        </p>
      </Section>

      {/* ── 9. CO₂ ──────────────────────────────────── */}
      <Section icon={Leaf} title="CO₂-reduktion">
        <p className="text-sm text-muted-foreground">
          CO₂-besparelsen beregnes ud fra det danske elnet's gennemsnitlige emissionsintensitet. Vi anvender Energinets officielle årsgennemsnit for 2023.
        </p>
        <Formula lines={[
          'co2Besparelse = selfConsumedTotal × 0,130 kg/kWh',
          '',
          '// Kilde: Energinet — Miljødeklaration for dansk el 2023',
          '// 130 g CO₂/kWh er årsgennemsnittet for dansk elproduktion',
        ]} />
        <p className="text-xs text-muted-foreground">
          Kun selvforbrugt produktion tæller — eksporteret el indgår ikke, da vi ikke kender den marginale produktionskilde på afsætningstidspunktet.
        </p>
      </Section>

      {/* ── 10. Metric definitions ──────────────────── */}
      <Section icon={BarChart2} title="Nøgletal — definitioner">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/3">Nøgletal</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Formel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  metric: 'Dækningsgrad',
                  formula: 'Σ egenforbrug[h] / Σ forbrug[h] × 100 %',
                  note: 'Hvor meget af dit elforbrug dækkes af solen',
                },
                {
                  metric: 'Egenforbrugspct.',
                  formula: 'Σ egenforbrug[h] / Σ produktion[h] × 100 %',
                  note: 'Hvor stor en del af produktionen bruges direkte i hjemmet',
                },
                {
                  metric: 'Estimeret besparelse',
                  formula: 'Σ besparelse[h]  (spot + tarif + feed-in)',
                  note: 'Samlet årlig besparelse inkl. salg til net',
                },
                {
                  metric: 'CO₂-reduktion',
                  formula: 'Σ egenforbrug[h] × 0,130 kg/kWh',
                  note: 'Baseret på dansk elnet årsgennemsnit 2023',
                },
                {
                  metric: 'Tilbagebetalingstid',
                  formula: 'Investering / estimeret besparelse  (år)',
                  note: 'Simpel lineær beregning uden diskonterings- eller degraderingsfaktor',
                },
              ].map(({ metric, formula, note }) => (
                <tr key={metric} className="bg-card">
                  <td className="px-4 py-3 font-medium text-foreground align-top">{metric}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-muted-foreground">{formula}</div>
                    <div className="text-muted-foreground mt-1 font-sans text-[11px]">{note}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

    </div>
  )
}
