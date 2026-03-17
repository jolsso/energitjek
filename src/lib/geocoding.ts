import type { Coordinates } from '@/types'
import type { PriceArea } from '@/lib/energidataservice'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export interface GeocodeResult {
  coordinates: Coordinates
  displayName: string  // Human-readable match for user verification
  postcode: string
  priceArea: PriceArea  // DK1 (Jylland/Fyn) or DK2 (Sjælland/øer)
}

/** DK1 = Jylland + Fyn (postnr. 5000–9999), DK2 = Sjælland + øer (1000–4999) */
export function priceAreaFromPostcode(postcode: string): PriceArea {
  return parseInt(postcode, 10) >= 5000 ? 'DK1' : 'DK2'
}

/**
 * Geocodes a Danish address to coordinates using Nominatim (OpenStreetMap).
 * No API key required. Address string is not logged or stored.
 * Returns the display name so the user can verify the match.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    q: `${address}, Danmark`,
    format: 'json',
    limit: '1',
    countrycodes: 'dk',
    addressdetails: '1',
  })

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'Accept-Language': 'da',
      'User-Agent': 'energitjek/1.0 (solar cost-benefit calculator)',
    },
  })

  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)

  const data = await res.json()
  if (!data.length) throw new Error('Adressen kunne ikke findes. Prøv igen med en mere specifik adresse.')

  const postcode: string = data[0].address?.postcode ?? ''
  return {
    coordinates: {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    },
    displayName: data[0].display_name as string,
    postcode,
    priceArea: postcode ? priceAreaFromPostcode(postcode) : 'DK2',
  }
}
