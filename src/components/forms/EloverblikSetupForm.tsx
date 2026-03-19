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
import { geocodeAddress } from '@/lib/geocoding'
import { DATA_YEAR } from '@/lib/pvgis'

const STORAGE_KEY = 'energitjek-eloverblik-token'

type Status = 'idle' | 'loading' | 'selecting' | 'done' | 'error'

function addressLabel(p: MeteringPoint): string {
  const street = p.streetName && p.buildingNumber
    ? `${p.streetName} ${p.buildingNumber}`
    : p.streetName ?? ''
  const city = p.postcode && p.cityName
    ? `${p.postcode} ${p.cityName}`
    : p.cityName ?? p.postcode ?? ''
  return [street, city].filter(Boolean).join(', ') || p.meteringPointId
}

function buildSearchAddress(p: MeteringPoint): string {
  return [
    p.streetName && p.buildingNumber ? `${p.streetName} ${p.buildingNumber}` : p.streetName,
    p.postcode,
    p.cityName,
  ].filter(Boolean).join(', ')
}

interface Summary {
  address: string
  annualKwh: number
  priceArea: string
  hasExport: boolean
}

export function EloverblikSetupForm() {
  const { setAddress, setPostcode, setCoordinates, setPriceArea, setConsumption } = useAppStore()

  const [token, setToken] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? import.meta.env.VITE_ELOVERBLIK_TOKEN ?? ''
  )
  const [rememberToken, setRememberToken] = useState(
    () => Boolean(localStorage.getItem(STORAGE_KEY))
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)

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
      if (!e17s.length) throw new Error('Ingen forbrugsmålepunkter (E17) fundet på din konto.')

      if (e17s.length === 1) {
        await doSetup(dt, points, e17s[0])
      } else {
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

  const handleSelect = async (importPoint: MeteringPoint) => {
    if (!dataToken) return
    setStatus('loading')
    try {
      await doSetup(dataToken, allPoints, importPoint)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Ukendt fejl')
      setStatus('error')
    }
  }

  const doSetup = async (dt: string, points: MeteringPoint[], importPoint: MeteringPoint) => {
    const exportPoint = findExportPoint(points, importPoint.meteringPointId)

    // Geocode address from metering point data
    const searchAddr = buildSearchAddress(importPoint)
    const geocoded = await geocodeAddress(searchAddr)

    // Fetch hourly consumption (+ export if present)
    const { importKwh, exportKwh, annualKwh, hasExport } = await fetchHourlyData(
      dt,
      importPoint.meteringPointId,
      exportPoint?.meteringPointId ?? null,
      DATA_YEAR,
    )

    if (rememberToken) localStorage.setItem(STORAGE_KEY, token.trim())

    // Populate store — everything is ready for simulation
    setAddress(geocoded.displayName)
    setPostcode(geocoded.postcode)
    setCoordinates(geocoded.coordinates)
    setPriceArea(geocoded.priceArea)
    setConsumption({
      source: 'eloverblik',
      annualKwh,
      hourlyKwh: importKwh,
      exportKwh: exportKwh ?? undefined,
      hasExport,
    })

    setSummary({
      address: addressLabel(importPoint),
      annualKwh: Math.round(annualKwh),
      priceArea: geocoded.priceArea,
      hasExport,
    })
    setStatus('done')
  }

  const handleReset = () => {
    setToken('')
    setRememberToken(false)
    setStatus('idle')
    setErrorMsg(null)
    setSummary(null)
    setAllPoints([])
    setImportPoints([])
    setDataToken(null)
    clearTokenCache()
    localStorage.removeItem(STORAGE_KEY)
    setAddress('')
    setCoordinates(null)
    setConsumption({ source: 'manual', hourlyKwh: undefined, exportKwh: undefined, hasExport: false })
  }

  if (status === 'done' && summary) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
          <p className="text-sm font-medium text-green-800">Alt hentet automatisk</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span><span className="font-medium">Adresse:</span> {summary.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span>
                <span className="font-medium">Forbrug:</span>{' '}
                {summary.annualKwh.toLocaleString('da-DK')} kWh/år · timebaseret profil
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span><span className="font-medium">Priszone:</span> {summary.priceArea}</span>
            </div>
            {summary.hasExport && (
              <div className="flex items-center gap-2 text-sm text-amber-700 border-t border-green-200 pt-2 mt-1">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Soleksport registreret — angiv dit eksisterende anlæg nedenfor</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Brug en anden konto eller adresse
        </button>
      </div>
    )
  }

  if (status === 'selecting') {
    return (
      <div className="space-y-3 max-w-md mx-auto">
        <p className="text-sm font-medium text-center">
          Vi fandt {importPoints.length} adresser — vælg den du vil beregne for:
        </p>
        {importPoints.map((p) => (
          <button
            key={p.meteringPointId}
            onClick={() => handleSelect(p)}
            className="w-full flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left hover:bg-muted transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{addressLabel(p)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.meteringPointId}</p>
            </div>
          </button>
        ))}
        <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground underline">
          Annullér
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="space-y-3">
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Log ind på <a href="https://eloverblik.dk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">eloverblik.dk <ExternalLink className="h-2.5 w-2.5" /></a> med MitID</li>
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
            disabled={status === 'loading' || !token.trim()}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'loading'
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
          <span className="text-xs text-muted-foreground">Husk token på denne enhed</span>
        </label>

        {rememberToken && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Tokenet gemmes ukrypteret i browserens localStorage. Undgå dette på delte computere.
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
      </div>
    </div>
  )
}
