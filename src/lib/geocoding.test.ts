import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocodeAddress, priceAreaFromPostcode } from './geocoding'

describe('priceAreaFromPostcode', () => {
  it('returns DK1 for Jylland/Fyn (5000–9999)', () => {
    expect(priceAreaFromPostcode('5000')).toBe('DK1')  // Odense
    expect(priceAreaFromPostcode('8000')).toBe('DK1')  // Aarhus
    expect(priceAreaFromPostcode('9000')).toBe('DK1')  // Aalborg
    expect(priceAreaFromPostcode('9999')).toBe('DK1')
  })

  it('returns DK2 for Sjælland/øer (1000–4999)', () => {
    expect(priceAreaFromPostcode('1000')).toBe('DK2')  // København
    expect(priceAreaFromPostcode('2100')).toBe('DK2')  // København Ø
    expect(priceAreaFromPostcode('3700')).toBe('DK2')  // Bornholm
    expect(priceAreaFromPostcode('4000')).toBe('DK2')  // Roskilde
  })

  it('handles the exact boundary: 4999 → DK2, 5000 → DK1', () => {
    expect(priceAreaFromPostcode('4999')).toBe('DK2')
    expect(priceAreaFromPostcode('5000')).toBe('DK1')
  })

  it('falls back to DK2 for missing or invalid postcode', () => {
    expect(priceAreaFromPostcode('')).toBe('DK2')
    expect(priceAreaFromPostcode('abc')).toBe('DK2')
  })
})

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns coordinates, display name, and price area on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          lat: '56.1629',
          lon: '10.2039',
          display_name: 'Rådhuspladsen, Aarhus, Danmark',
          address: { postcode: '8000' },
        },
      ]),
    }))

    const result = await geocodeAddress('Rådhuspladsen, Aarhus')

    expect(result.coordinates.lat).toBeCloseTo(56.1629)
    expect(result.coordinates.lon).toBeCloseTo(10.2039)
    expect(result.displayName).toBe('Rådhuspladsen, Aarhus, Danmark')
    expect(result.priceArea).toBe('DK1')  // Aarhus = 8000 = DK1
  })

  it('throws a Danish error message when no results found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([]),
    }))

    await expect(geocodeAddress('xyzxyzxyz')).rejects.toThrow(
      'Adressen kunne ikke findes',
    )
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(geocodeAddress('Aarhus')).rejects.toThrow('429')
  })

  it('appends Danmark and countrycodes=dk to the request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([{ lat: '55', lon: '12', display_name: 'Test', address: {} }]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await geocodeAddress('Strøget')

    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('Danmark')
    expect(calledUrl).toContain('countrycodes=dk')
  })
})
