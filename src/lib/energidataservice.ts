import type { HourlyPrice } from '@/types'

const EDS_BASE = 'https://api.energidataservice.dk/dataset'

export type PriceArea = 'DK1' | 'DK2'

/**
 * Fetches hourly spot prices for a given year and price area from
 * Energidataservice. Open API, no authentication required.
 */
export async function fetchSpotPrices(
  year: number,
  area: PriceArea,
): Promise<HourlyPrice[]> {
  const start = `${year}-01-01T00:00`
  const end = `${year + 1}-01-01T00:00`

  const params = new URLSearchParams({
    start,
    end,
    filter: JSON.stringify({ PriceArea: area }),
    sort: 'HourDK asc',
    limit: '8784', // max hours in a year (leap year)
  })

  const res = await fetch(`${EDS_BASE}/Elspotprices?${params}`)
  if (!res.ok) throw new Error(`Energidataservice fejlede: ${res.status}`)

  const json = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return json.records.map((r: any): HourlyPrice => ({
    hourStart: r.HourDK,
    spotEur: r.SpotPriceEUR ?? 0,
    // Tariffs are hardcoded for now — a real integration would fetch from
    // Datahub / the network company. 0.20 DKK/kWh is a rough average.
    tariffDkk: 0.20,
  }))
}

/**
 * Approximate EUR → DKK conversion. In a future version this could fetch
 * live rates from the Danish National Bank.
 */
export const EUR_TO_DKK = 7.46
