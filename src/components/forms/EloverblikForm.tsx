import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ExternalLink, ShieldAlert, MapPin } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import {
  fetchDataAccessToken,
  fetchAllMeteringPoints,
  findExportPoint,
  fetchHourlyData,
  clearTokenCache,
  type MeteringPoint,
} from '@/lib/eloverblik'
import { DATA_YEAR } from '@/lib/pvgis'

const STORAGE_KEY = 'energitjek-eloverblik-token'

type Status = 'idle' | 'loading' | 'selecting' | 'fetching' | 'success' | 'error'

function addressLabel(p: MeteringPoint): string {
  const parts = [
    p.streetName && p.buildingNumber
      ? `${p.streetName} ${p.buildingNumber}`
      : p.streetName ?? '',
    p.postcode && p.cityName
      ? `${p.postcode} ${p.cityName}`
      : p.cityName ?? p.postcode ?? '',
  ].filter(Boolean)
  return parts.join(', ') || p.meteringPointId
}

export function EloverblikForm() {
  const { setConsumption } = useAppStore()
  const [token, setToken] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? import.meta.env.VITE_ELOVERBLIK_TOKEN ?? ''
  )
  const [rememberToken, setRememberToken] = useState(
    () => Boolean(localStorage.getItem(STORAGE_KEY))
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fetchedKwh, setFetchedKwh] = useState<number | null>(null)
  const [detectedExport, setDetectedExport] = useState(false)

  // Address selection state
  const [allPoints, setAllPoints] = useState<MeteringPoint[]>([])
  const [importPoints, setImportPoints] = useState<MeteringPoint[]>([])
  const [dataToken, setDataToken] = useState<string | null>(null)

  const handleFetch = async () => {
    if (!token.trim()) return
    setStatus('loading')
    setErrorMsg(null)
    clearTokenCache()

    try {
      const dt = await fetchDataAccessToken(token.trim())
      const points = await fetchAllMeteringPoints(dt)

      const e17s = points.filter((p) => p.typeOfMP === 'E17')
      if (!e17s.length) throw new Error('Ingen forbrugsmålepunkter (E17) fundet.')

      if (e17s.length === 1) {
        // Only one address — fetch immediately
        await doFetchData(dt, points, e17s[0].meteringPointId)
      } else {
        // Multiple addresses — let user pick
        setDataToken(dt)
        setAllPoints(points)
        setImportPoints(e17s)
        setStatus('selecting')
        if (rememberToken) localStorage.setItem(STORAGE_KEY, token.trim())
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Ukendt fejl')
      setStatus('error')
    }
  }

  const handleSelectAddress = async (importId: string) => {
    if (!dataToken) return
    setStatus('fetching')
    setErrorMsg(null)
    try {
      await doFetchData(dataToken, allPoints, importId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Ukendt fejl')
      setStatus('error')
    }
  }

  const doFetchData = async (dt: string, points: MeteringPoint[], importId: string) => {
    const exportPoint = findExportPoint(points, importId)
    const exportId = exportPoint?.meteringPointId ?? null

    const { importKwh, exportKwh, annualKwh, hasExport } = await fetchHourlyData(dt, importId, exportId, DATA_YEAR)

    if (rememberToken) localStorage.setItem(STORAGE_KEY, token.trim())

    setConsumption({
      source: 'eloverblik',
      annualKwh,
      hourlyKwh: importKwh,
      exportKwh: exportKwh ?? undefined,
      hasExport,
    })
    setFetchedKwh(Math.round(annualKwh))
    setDetectedExport(hasExport)
    setStatus('success')
  }

  const handleReset = () => {
    setToken('')
    setRememberToken(false)
    setStatus('idle')
    setErrorMsg(null)
    setFetchedKwh(null)
    setDetectedExport(false)
    setAllPoints([])
    setImportPoints([])
    setDataToken(null)
    clearTokenCache()
    localStorage.removeItem(STORAGE_KEY)
    setConsumption({ source: 'manual', hourlyKwh: undefined, exportKwh: undefined, hasExport: false })
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Hent dit faktiske forbrug</p>
        <a
          href="https://eloverblik.dk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          eloverblik.dk <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {status === 'selecting' && (
        <div className="space-y-2">
          <p className="text-xs font-medium">
            Vi fandt {importPoints.length} adresser på din konto — vælg den du vil beregne for:
          </p>
          {importPoints.map((p) => (
            <button
              key={p.meteringPointId}
              onClick={() => handleSelectAddress(p.meteringPointId)}
              className="w-full flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-left hover:bg-muted transition-colors"
            >
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium leading-tight">{addressLabel(p)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.meteringPointId}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Annullér
          </button>
        </div>
      )}

      {status !== 'success' && status !== 'selecting' && (
        <>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Log ind på eloverblik.dk med MitID</li>
            <li>Klik <span className="font-medium text-foreground">☰ hamburgermenu</span> øverst</li>
            <li>Vælg <span className="font-medium text-foreground">API access</span></li>
            <li>Klik <span className="font-medium text-foreground">Opret token</span>, giv det et navn og acceptér vilkårene</li>
            <li>Kopiér tokenet — <span className="font-medium text-foreground">det vises kun én gang</span></li>
          </ol>

          <div className="flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              placeholder="Indsæt dit Eloverblik-token"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
            />
            <button
              onClick={handleFetch}
              disabled={status === 'loading' || status === 'fetching' || !token.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' || status === 'fetching'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : 'Hent data'}
            </button>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(e) => setRememberToken(e.target.checked)}
              className="mt-0.5 accent-primary shrink-0"
            />
            <span className="text-xs text-muted-foreground">
              Husk token på denne enhed
            </span>
          </label>

          {rememberToken && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Tokenet gemmes ukrypteret i browserens localStorage. Undgå dette på delte computere. Tokenet giver adgang til dine forbrugsdata på eloverblik.dk.
              </p>
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-600">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Tokenet sendes kun til din egen server og bruges ikke til andet end at hente forbrugsdata.
          </p>
        </>
      )}

      {status === 'success' && fetchedKwh !== null && (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2 rounded-md bg-green-50 border border-green-200 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-800">
                  Forbrugsdata hentet ({DATA_YEAR})
                </p>
                <p className="text-xs text-green-700">
                  {fetchedKwh.toLocaleString('da-DK')} kWh · timebaseret profil
                  {detectedExport && ' · soleksport detekteret'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
            >
              Nulstil
            </button>
          </div>

          {detectedExport && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5">
              <p className="text-xs font-medium text-amber-800">
                ☀️ Vi ser du eksporterer solstrøm
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Udfyld dit eksisterende anlæg nedenfor — vi beregner dit faktiske bruttoforbrug og simulerer effekten af en udvidelse.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
