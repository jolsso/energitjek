import type { Coordinates, PVGISData, SolarConfig } from '@/types'

// Requests go through /api/pvgis which is proxied to re.jrc.ec.europa.eu
// in both dev (Vite proxy) and production (nginx proxy_pass).
// PVGIS does not send CORS headers so direct browser requests are blocked.
const PVGIS_BASE = '/api/pvgis'

// Most recent year with confirmed full data in PVGIS
export const DATA_YEAR = 2023

/**
 * Fetches hourly PV production data for a single year from PVGIS (EU Commission).
 * Free, no API key required.
 *
 * seriescalc returns hourly rows with format: { time: "YYYYMMDD:HHMM", P: W, "G(i)": W/m², ... }
 * No totals field — annual kWh is summed from hourly P values.
 */
export async function fetchPVGISData(
  coords: Coordinates,
  config: SolarConfig,
): Promise<PVGISData> {
  const params = new URLSearchParams({
    lat: coords.lat.toString(),
    lon: coords.lon.toString(),
    peakpower: config.peakKw.toString(),
    loss: config.systemLossPct.toString(),
    angle: config.tiltDeg.toString(),
    aspect: config.azimuthDeg.toString(),
    startyear: DATA_YEAR.toString(),
    endyear: DATA_YEAR.toString(),
    outputformat: 'json',
    browser: '1',
    usehorizon: '1',
    pvcalculation: '1',
    pvtechchoice: 'crystSi',
    mountingplace: 'building',
  })

  const res = await fetch(`${PVGIS_BASE}/seriescalc?${params}`)
  if (!res.ok) throw new Error(`PVGIS fejlede: ${res.status}`)

  const json = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hourly = json.outputs.hourly.map((row: any) => ({
    time: row.time as string,
    P: row.P as number,
    G_i: row['G(i)'] as number,
    T2m: row.T2m as number,
  }))

  // seriescalc has no totals field — derive annual kWh from hourly P (W → kWh)
  const annualKwh = hourly.reduce((sum: number, h: { P: number }) => sum + h.P / 1000, 0)

  return { hourly, annualKwh, location: coords }
}

/**
 * Converts PVGIS time format "YYYYMMDD:HHMM" to ISO 8601.
 * Real API format: datePart is 8 chars, timePart is 4 chars (HHMM).
 * Example: "20230615:1411" → "2023-06-15T14:11:00"
 */
export function pvgisTimeToISO(time: string): string {
  const colonIdx = time.indexOf(':')
  if (colonIdx === 8) {
    const datePart = time.slice(0, 8)
    const timePart = time.slice(9)   // HHMM
    const y = datePart.slice(0, 4)
    const mo = datePart.slice(4, 6)
    const d = datePart.slice(6, 8)
    const hh = timePart.slice(0, 2)
    const mm = timePart.slice(2, 4)
    return `${y}-${mo}-${d}T${hh}:${mm}:00`
  }
  return time
}

/**
 * Converts PVGIS time format "YYYYMMDD:HHMM" (UTC) to a Copenhagen
 * local-time hour string "YYYY-MM-DDTHH" for matching against
 * Energidataservice HourDK timestamps.
 *
 * PVGIS API v5 returns times in UTC. Energidataservice uses Danish local
 * time (CET = UTC+1 / CEST = UTC+2). Aligning by array index causes a
 * systematic 1–2 hour shift; this function corrects it.
 *
 * Uses Intl.DateTimeFormat so DST transitions are handled automatically.
 */
export function pvgisTimeToCopenhagenHour(time: string): string {
  const datePart = time.slice(0, 8)
  const hh = time.slice(9, 11)
  const utcDate = new Date(
    `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T${hh}:00:00Z`
  )
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(utcDate)
  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => { p[type] = value })
  return `${p.year}-${p.month}-${p.day}T${p.hour}`
}
