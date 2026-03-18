import { DATA_YEAR } from './pvgis'

const BASE = '/api/eloverblik'

// Module-level cache for the 24-hour data access token
let _cachedToken: { value: string; expiresAt: number } | null = null

/**
 * Exchange a long-lived Eloverblik refresh token for a 24-hour data access token.
 * Result is cached in memory for the session to avoid hammering the rate-limited endpoint.
 */
export async function fetchDataAccessToken(refreshToken: string): Promise<string> {
  if (_cachedToken && Date.now() < _cachedToken.expiresAt) {
    return _cachedToken.value
  }

  const res = await fetch(`${BASE}/api/token`, {
    headers: { Authorization: `Bearer ${refreshToken.trim()}` },
  })
  if (!res.ok) throw new Error(`Eloverblik token-fejl: ${res.status}. Kontrollér at tokenet er gyldigt.`)

  const data = await res.json()
  const token = data.result as string
  if (!token) throw new Error('Tomt token-svar fra Eloverblik.')

  _cachedToken = { value: token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }
  return token
}

/** Clears the cached data access token (e.g. on refresh token change). */
export function clearTokenCache(): void {
  _cachedToken = null
}

/**
 * Returns the first metering point ID accessible with the given data access token.
 * @deprecated Use fetchMeteringPoints for new code.
 */
export async function fetchMeteringPointId(dataToken: string): Promise<string> {
  const { importId } = await fetchMeteringPoints(dataToken)
  return importId
}

/**
 * Returns import (E17) and export (E18) metering point IDs.
 * exportId is null if no solar export meter is found.
 */
export async function fetchMeteringPoints(
  dataToken: string,
): Promise<{ importId: string; exportId: string | null }> {
  const res = await fetch(`${BASE}/api/meteringpoints/meteringpoints?includeAll=false`, {
    headers: { Authorization: `Bearer ${dataToken}` },
  })
  if (!res.ok) throw new Error(`Målepunkter kunne ikke hentes: ${res.status}`)

  const data = await res.json()
  const points: { meteringPointId: string; typeOfMP?: string }[] = data.result ?? []
  if (!points.length) throw new Error('Ingen målepunkter fundet. Kontrollér at tokenet har adgang til forbrugsdata.')

  const importPoint = points.find((p) => p.typeOfMP === 'E17') ?? points[0]
  const exportPoint = points.find((p) => p.typeOfMP === 'E18') ?? null

  return {
    importId: importPoint.meteringPointId,
    exportId: exportPoint?.meteringPointId ?? null,
  }
}

/**
 * Fetches hourly consumption for a full year via the Eloverblik MeterData API.
 * Returns a flat array of kWh values (one per hour, 8760 entries for non-leap years)
 * aligned with PVGIS data (Danish local time, UTC+1 winter / UTC+2 summer).
 * @deprecated Use fetchHourlyData for new code.
 */
export async function fetchHourlyConsumption(
  dataToken: string,
  meteringPointId: string,
  year: number = DATA_YEAR,
): Promise<{ hourlyKwh: number[]; annualKwh: number }> {
  const { importKwh, annualKwh } = await fetchHourlyData(dataToken, meteringPointId, null, year)
  return { hourlyKwh: importKwh, annualKwh }
}

/**
 * Fetches hourly import and optionally export data for a full year.
 * When exportId is provided, both meters are fetched in a single API call.
 */
export async function fetchHourlyData(
  dataToken: string,
  importId: string,
  exportId: string | null,
  year: number = DATA_YEAR,
): Promise<{ importKwh: number[]; exportKwh: number[] | null; annualKwh: number; hasExport: boolean }> {
  // Fetch slightly wider than one year to capture all local-time hours
  const dateFrom = `${year - 1}-12-31`
  const dateTo   = `${year + 1}-01-01`

  const ids = exportId ? [importId, exportId] : [importId]

  const res = await fetch(`${BASE}/api/meterdata/gettimeseries/${dateFrom}/${dateTo}/Hour`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dataToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meteringPoints: { meteringPoint: ids } }),
  })
  if (!res.ok) throw new Error(`Forbrugsdata kunne ikke hentes: ${res.status}`)

  const data = await res.json()
  const { hourlyKwh: importKwh, annualKwh } = parseConsumptionResponse(data, year, 0)

  let exportKwh: number[] | null = null
  if (exportId) {
    const { hourlyKwh } = parseConsumptionResponse(data, year, 1)
    exportKwh = hourlyKwh
  }

  return { importKwh, exportKwh, annualKwh, hasExport: exportId !== null }
}

// --- Types for the CIM/EDIFACT response format ---

interface EloverblikPoint {
  position: string
  'out_Quantity.quantity': string
  'out_Quantity.quality'?: string
}

interface EloverblikPeriod {
  timeInterval: { start: string; end: string }
  resolution: string
  Point: EloverblikPoint[]
}

interface EloverblikTimeSeries {
  Period: EloverblikPeriod[]
}

/**
 * Parses the deeply nested CIM/EDIFACT response from the Eloverblik MeterData API.
 * Maps UTC-timestamped points to a flat hourly array aligned with Danish local time.
 *
 * Timestamps: Eloverblik uses UTC. A period starting at "2022-12-31T23:00:00Z"
 * represents January 1 00:00 CET (UTC+1). Each point's position (1-based) adds
 * that many hours to the period start.
 */
export function parseConsumptionResponse(
  raw: unknown,
  year: number,
  resultIndex: number = 0,
): { hourlyKwh: number[]; annualKwh: number } {
  const doc = (raw as Record<string, unknown>)
  const result = (doc?.['result'] as unknown[])?.[resultIndex] as Record<string, unknown>
  const marketDoc = result?.['MyEnergyData_MarketDocument'] as Record<string, unknown>
  const timeSeries = ((marketDoc?.['TimeSeries'] as unknown[]) ?? [])[0] as EloverblikTimeSeries

  if (!timeSeries?.Period) {
    throw new Error('Ugyldigt dataformat fra Eloverblik — ingen tidsserier fundet.')
  }

  // Build UTC-ms → kWh lookup for every recorded hour
  const hourMap = new Map<number, number>()
  for (const period of timeSeries.Period) {
    const periodStartMs = new Date(period.timeInterval.start).getTime()
    for (const point of period.Point) {
      const pos    = parseInt(point.position, 10) - 1  // 0-indexed offset
      const utcMs  = periodStartMs + pos * 3_600_000
      const kwh    = parseFloat(point['out_Quantity.quantity'] ?? '0') || 0
      hourMap.set(utcMs, kwh)
    }
  }

  // Jan 1 00:00 CET (UTC+1) = Dec 31 of prior year 23:00 UTC
  const startUtcMs  = Date.UTC(year - 1, 11, 31, 23, 0, 0)
  const hoursInYear = _isLeapYear(year) ? 8784 : 8760

  const hourlyKwh: number[] = []
  for (let i = 0; i < hoursInYear; i++) {
    hourlyKwh.push(hourMap.get(startUtcMs + i * 3_600_000) ?? 0)
  }

  const annualKwh = hourlyKwh.reduce((s, v) => s + v, 0)
  return { hourlyKwh, annualKwh }
}

function _isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}
