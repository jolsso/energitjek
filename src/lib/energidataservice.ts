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
    // Fixed tariff breakdown (incl. 25% VAT):
    //   elafgift (electricity tax): ~0.699 DKK/kWh
    //   network tariff (nettarif):  ~0.40 DKK/kWh
    //   system tariff:              ~0.08 DKK/kWh
    //   balancetariff/other:        ~0.22 DKK/kWh
    //   Total:                      ~1.40 DKK/kWh
    tariffDkk: 1.40,
  }))
}

/**
 * Fetches hourly grid CO2 emission factors (kg CO2eq/kWh) for a given year
 * and price area from Energidataservice (DeclarationEmissionHour dataset).
 * Returns an array of 8760/8784 values indexed by hour-of-year.
 */
export async function fetchCO2Emissions(
  year: number,
  area: PriceArea,
): Promise<number[]> {
  const start = `${year}-01-01T00:00`
  const end   = `${year + 1}-01-01T00:00`

  const params = new URLSearchParams({
    start,
    end,
    filter: JSON.stringify({ PriceArea: area }),
    sort:   'HourDK asc',
    limit:  '8784',
  })

  const res = await fetch(`${EDS_BASE}/DeclarationEmissionHour?${params}`)
  if (!res.ok) throw new Error(`CO2-data fejlede: ${res.status}`)

  const json = await res.json()
  // CO2Emission is in g CO2eq/kWh — convert to kg/kWh
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return json.records.map((r: any) => (r.CO2Emission ?? 130) / 1000)
}

/**
 * Approximate EUR → DKK conversion. In a future version this could fetch
 * live rates from the Danish National Bank.
 */
export const EUR_TO_DKK = 7.46

/**
 * VAT multiplier for Danish electricity (25%).
 * Applied to the spot price component of retail price.
 */
export const VAT_MULTIPLIER = 1.25

/**
 * Feed-in multiplier: exported electricity is sold at 90% of spot price.
 * No VAT or taxes apply to grid exports.
 */
export const FEED_IN_MULTIPLIER = 0.90
