import type { Coordinates } from '@/types'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export interface GeocodeResult {
  coordinates: Coordinates
  displayName: string  // Human-readable match for user verification
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

  return {
    coordinates: {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    },
    displayName: data[0].display_name as string,
  }
}
