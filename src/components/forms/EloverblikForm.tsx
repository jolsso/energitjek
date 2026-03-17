import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { fetchDataAccessToken, fetchMeteringPointId, fetchHourlyConsumption, clearTokenCache } from '@/lib/eloverblik'
import { DATA_YEAR } from '@/lib/pvgis'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function EloverblikForm() {
  const { setConsumption } = useAppStore()
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fetchedKwh, setFetchedKwh] = useState<number | null>(null)

  const handleFetch = async () => {
    if (!token.trim()) return
    setStatus('loading')
    setErrorMsg(null)
    clearTokenCache()

    try {
      const dataToken = await fetchDataAccessToken(token.trim())
      const meteringPointId = await fetchMeteringPointId(dataToken)
      const { hourlyKwh, annualKwh } = await fetchHourlyConsumption(dataToken, meteringPointId, DATA_YEAR)

      setConsumption({ source: 'eloverblik', annualKwh, hourlyKwh })
      setFetchedKwh(Math.round(annualKwh))
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Ukendt fejl')
      setStatus('error')
    }
  }

  const handleReset = () => {
    setToken('')
    setStatus('idle')
    setErrorMsg(null)
    setFetchedKwh(null)
    clearTokenCache()
    setConsumption({ source: 'manual', hourlyKwh: undefined })
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

      {status !== 'success' && (
        <>
          <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
            <li>Log ind på eloverblik.dk med MitID</li>
            <li>Gå til <span className="font-medium text-foreground">Profil → Datadeling</span></li>
            <li>Klik <span className="font-medium text-foreground">Opret token</span> og kopiér det</li>
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
        <div className="flex items-start justify-between gap-2 rounded-md bg-green-50 border border-green-200 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-green-800">
                Forbrugsdata hentet ({DATA_YEAR})
              </p>
              <p className="text-xs text-green-700">
                {fetchedKwh.toLocaleString('da-DK')} kWh · timebaseret profil
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
      )}
    </div>
  )
}
