import { ShieldCheck, Database, MapPin, Eye, ArrowLeft } from 'lucide-react'

interface Props {
  onBack: () => void
}

const SERVICES = [
  {
    name: 'Nominatim',
    org: 'OpenStreetMap',
    domain: 'nominatim.openstreetmap.org',
    sends: 'Adressetekst',
    receives: 'Koordinater (lat/lon)',
    note: 'Engangsforespørgsel. Adressen kasseres bagefter — kun koordinaterne bruges videre.',
    optional: false,
    via: null,
  },
  {
    name: 'PVGIS',
    org: 'EU-Kommissionen',
    domain: 're.jrc.ec.europa.eu',
    sends: 'Koordinater + anlægsdata',
    receives: 'Timebaseret solproduktion',
    note: 'Anmodningen går via en Vercel-proxy-funktion for at omgå browser-CORS-begrænsninger. Svaret caches i Vercels CDN i op til 7 dage, nøglet på koordinater og anlægsparametre — ingen persondata.',
    optional: false,
    via: 'proxy',
  },
  {
    name: 'Energidataservice',
    org: 'Energinet',
    domain: 'api.energidataservice.dk',
    sends: 'Priszone (DK1/DK2)',
    receives: 'Spotpriser + nettariffer',
    note: 'Offentlig API. Ingen persondata sendes.',
    optional: false,
    via: null,
  },
  {
    name: 'Eloverblik',
    org: 'Energinet',
    domain: 'api.eloverblik.dk',
    sends: 'Dit API-token',
    receives: 'Timebaseret forbrug (kWh)',
    note: 'Kun aktivt hvis du indtaster et token. Anmodningen går via en Vercel-proxy-funktion — tokenet logges ikke. Forbrugsdata gemmes aldrig uden for din browser.',
    optional: true,
    via: 'proxy',
  },
  {
    name: 'Vercel Analytics',
    org: 'Vercel',
    domain: 'vitals.vercel-insights.com',
    sends: 'Anonym sidevisning',
    receives: '—',
    note: 'Ingen cookies. Ingen IP-adresser gemt. Kun aggregerede besøgstal bruges til at forbedre sitet.',
    optional: false,
    via: null,
  },
]

const STORAGE_ITEMS = [
  { key: 'Adresse', stored: false, note: 'Kasseres efter geokodning' },
  { key: 'Koordinater (lat/lon)', stored: true, note: 'Gemt i localStorage' },
  { key: 'Solcelleanlæg-konfiguration', stored: true, note: 'Gemt i localStorage' },
  { key: 'Priszone', stored: true, note: 'Gemt i localStorage' },
  { key: 'Årligt elforbrug (kWh)', stored: true, note: 'Gemt i localStorage' },
  { key: 'Timebaseret forbrugsdata (Eloverblik)', stored: false, note: 'Gemmes aldrig — kun i sessionens hukommelse' },
  { key: 'Eloverblik-token', stored: false, note: 'Kun hvis du selv vælger "Husk token"' },
]

export function PrivacyPage({ onBack }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">

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
          <ShieldCheck className="h-8 w-8 text-primary" />
          Privatliv & datasikkerhed
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Er du sunshine? er bygget på et enkelt princip: al beregning sker i din browser. Sitet hostes på Vercel og bruger to proxy-funktioner til at videresende API-kald. PVGIS-svar caches kortvarigt i Vercels CDN (op til 7 dage) for at reducere belastningen — ingen persondata gemmes. Nedenfor kan du se præcist, hvilke eksterne tjenester din browser taler med — og hvad der sendes.
        </p>
      </div>

      {/* Key points */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, title: 'Ingen server-behandling', body: 'Beregningerne kører 100 % i din browser. Vercel-hostingen bruges kun til at serve sitet og som proxy for to tredjepartsAPIer.' },
          { icon: Database, title: 'Minimal localStorage', body: 'Kun konfiguration (adresse, anlæg, priszone) gemmes lokalt i din browser. Forbrugsdata gemmes aldrig.' },
          { icon: Eye, title: 'Ingen tracking', body: 'Ingen cookies. Vercel Analytics indsamler kun anonyme sidevisninger — ingen IP-adresser, ingen fingerprinting.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Data flow diagram */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Dataflow — hvem taler din browser med?</h2>

        {/* Browser node */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/5 px-6 py-3 font-semibold text-sm shadow-sm">
            <MapPin className="h-4 w-4 text-primary" />
            Din browser
          </div>
        </div>

        {/* Connector stem */}
        <div className="flex justify-center">
          <div className="w-px h-5 bg-border" />
        </div>

        {/* Horizontal rail + service columns */}
        <div className="relative">
          {/* Horizontal rail */}
          <div className="absolute top-0 left-[5%] right-[5%] h-px bg-border" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-0">
            {SERVICES.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-0">
                {/* Drop line from rail */}
                <div className="w-px h-5 bg-border" />
                {/* Service card */}
                <div className={`w-full rounded-xl border p-3 space-y-2 text-xs ${s.optional ? 'border-dashed border-border bg-muted/30' : 'border-border bg-card'}`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-foreground leading-tight">{s.name}</span>
                    {s.optional && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">valgfri</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-[11px]">{s.org}</div>

                  <div className="space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="text-orange-500 font-medium shrink-0">→</span>
                      <span className="text-muted-foreground">{s.sends}</span>
                    </div>
                    {s.receives !== '—' && (
                      <div className="flex items-start gap-1">
                        <span className="text-green-600 font-medium shrink-0">←</span>
                        <span className="text-muted-foreground">{s.receives}</span>
                      </div>
                    )}
                  </div>

                  {s.via && (
                    <div className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      Via server-proxy
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-2">
          {SERVICES.map((s) => (
            <p key={s.name} className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{s.name}:</span> {s.note}
            </p>
          ))}
        </div>
      </div>

      {/* localStorage table */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Hvad gemmes i din browser?</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Gemmes</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Bemærkning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STORAGE_ITEMS.map((item) => (
                <tr key={item.key} className="bg-card">
                  <td className="px-4 py-2.5 text-foreground">{item.key}</td>
                  <td className="px-4 py-2.5">
                    {item.stored
                      ? <span className="text-amber-600 font-medium">localStorage</span>
                      : <span className="text-green-600 font-medium">Nej</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
