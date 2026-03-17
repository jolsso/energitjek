import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns coordinates and display name on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          lat: '56.1629',
          lon: '10.2039',
          display_name: 'Rådhuspladsen, Aarhus, Danmark',
        },
      ]),
    }))

    const result = await geocodeAddress('Rådhuspladsen, Aarhus')

    expect(result.coordinates.lat).toBeCloseTo(56.1629)
    expect(result.coordinates.lon).toBeCloseTo(10.2039)
    expect(result.displayName).toBe('Rådhuspladsen, Aarhus, Danmark')
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
      json: async () => ([{ lat: '55', lon: '12', display_name: 'Test' }]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await geocodeAddress('Strøget')

    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('Danmark')
    expect(calledUrl).toContain('countrycodes=dk')
  })
})
