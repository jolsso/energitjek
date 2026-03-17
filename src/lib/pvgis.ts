import type { Coordinates, PVGISData, SolarConfig } from '@/types'

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3'

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
