import type { Coordinates, PVGISData, SolarConfig } from '@/types'

// Requests go through /api/pvgis which is proxied to re.jrc.ec.europa.eu
// in both dev (Vite proxy) and production (nginx proxy_pass).
// PVGIS does not send CORS headers so direct browser requests are blocked.
const PVGIS_BASE = '/api/pvgis'

/**
 * Fetches hourly PV production data from PVGIS (EU Commission).
 * Free, no API key required, CORS-enabled.
 *
 * Uses a "typical meteorological year" (TMY) to give a representative
 * annual production profile regardless of selected year.
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
    outputformat: 'json',
    browser: '1',
    usehorizon: '1',
    pvcalculation: '1',
    pvtechchoice: 'crystSi',
    mountingplace: 'building',
    components: '1',
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

  const annualKwh: number = json.outputs.totals.fixed.E_y

  return { hourly, annualKwh, location: coords }
}
