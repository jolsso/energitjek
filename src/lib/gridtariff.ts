const DATAHUB_URL = 'https://api.energidataservice.dk/dataset/DatahubPricelist'

export interface DSOInfo {
  glnNumber: string
  name: string
}

/**
 * Elafgift: national excise tax, same for all customers.
 * Rate from 2024: 0.699 DKK/kWh excl. VAT (set by Danish law).
 */
export const ELAFGIFT_DKK = 0.699

/**
 * Energinet system tariffs (systemtarif + transmissionsnettarif).
 * Approximate national flat rate, excl. VAT.
 */
export const SYSTEM_TARIFF_DKK = 0.065

/**
 * Fallback nettarif when DSO-specific lookup fails, excl. VAT.
 * National average across all DSOs. Combined with ELAFGIFT_DKK and
 * SYSTEM_TARIFF_DKK gives ~1.40 DKK/kWh incl. VAT:
 *   (0.355 + 0.699 + 0.065) × 1.25 = 1.399 DKK/kWh
 */
export const FALLBACK_NETTARIF_DKK = 0.355

/**
 * Approximate postal code → DSO mapping for major Danish network operators.
 * Covers ~95% of households. Boundaries are simplified — some edge areas
 * (e.g. Vejle/TREFOR, parts of Fyn) may map to the nearest major DSO.
 */
const POSTCODE_DSO_RANGES: [number, number, DSOInfo][] = [
  [1000, 2999, { glnNumber: '5790000705689', name: 'Radius Elnet A/S' }],     // Storkøbenhavn + indre Nordsjælland
  [3000, 4999, { glnNumber: '5790000705184', name: 'Cerius A/S' }],            // Resten af Sjælland + øer
  [5000, 5999, { glnNumber: '5790000836727', name: 'Ravdex A/S' }],            // Fyn (SE Net)
  [6000, 7999, { glnNumber: '5790001089030', name: 'N1 A/S' }],                // Syd- og Vestjylland
  [8000, 8999, { glnNumber: '5790001100520', name: 'Elnet Midt A/S' }],        // Aarhus / Midtjylland
  [9000, 9999, { glnNumber: '5790000610877', name: 'Nord Energi Net A/S' }],   // Nordjylland
]

export function dsoFromPostcode(postcode: string): DSOInfo | null {
  const num = parseInt(postcode, 10)
  if (isNaN(num)) return null
  return POSTCODE_DSO_RANGES.find(([from, to]) => num >= from && num <= to)?.[2] ?? null
}

/**
 * Fetches current residential grid tariff (Nettarif C) for a DSO.
 * Returns 24 hourly DKK/kWh values (nettarif only, excl. VAT).
 * Price1 = 00:00–01:00, Price24 = 23:00–00:00.
 */
export async function fetchGridTariff(glnNumber: string): Promise<number[]> {
  const filter = JSON.stringify({ ChargeType: ['D03'], GLN_Number: [glnNumber] })
  const params = new URLSearchParams({ filter, sort: 'ValidFrom desc', limit: '50' })

  const res = await fetch(`${DATAHUB_URL}?${params}`)
  if (!res.ok) throw new Error(`DatahubPricelist: ${res.status}`)

  const data = await res.json()
  const records: Record<string, unknown>[] = data.records ?? []

  const today = new Date()

  const current = records.find((r) => {
    const validTo = r['ValidTo'] as string | null
    const validFrom = new Date(r['ValidFrom'] as string)
    const note = ((r['Note'] as string) ?? '').toLowerCase()
    const resolution = r['ResolutionDuration'] as string

    const isActive = (!validTo || new Date(validTo) > today) && validFrom <= today
    const isNettarifC = note.includes('nettarif c')
    const isHourly = resolution === 'PT1H'

    return isActive && isNettarifC && isHourly
  })

  if (!current) throw new Error(`Ingen aktiv Nettarif C fundet for GLN ${glnNumber}`)

  return Array.from({ length: 24 }, (_, i) => (current[`Price${i + 1}`] as number) ?? 0)
}
