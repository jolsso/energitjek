import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pvgisTimeToISO, pvgisTimeToCopenhagenHour, fetchPVGISData } from './pvgis'
import type { SolarConfig } from '@/types'

const COORDS = { lat: 56.15, lon: 10.21 }
const CONFIG: SolarConfig = { peakKw: 6, tiltDeg: 35, azimuthDeg: 0, systemLossPct: 14 }

// Minimal PVGIS seriescalc response matching the real API shape.
// The real API returns { outputs: { hourly: [...] } } — NO totals field.
function makeRealPVGISResponse(hours = 3) {
  return {
    outputs: {
      hourly: Array.from({ length: hours }, (_, i) => ({
        time: `20230101:${String(i).padStart(2, '0')}00`,
        P: 1000 * i,
        'G(i)': 200 * i,
        T2m: 5,
      })),
      // NOTE: no "totals" field — seriescalc does not include it
    },
    meta: { latitude: 56.15, longitude: 10.21 },
  }
}

// --- pvgisTimeToISO ---

describe('pvgisTimeToISO — real API format "YYYYMMDD:HHMM"', () => {
  it('converts midday entry correctly', () => {
    expect(pvgisTimeToISO('20230615:1411')).toBe('2023-06-15T14:11:00')
  })

  it('converts midnight entry correctly', () => {
    expect(pvgisTimeToISO('20230101:0000')).toBe('2023-01-01T00:00:00')
  })

  it('converts last hour of year correctly', () => {
    expect(pvgisTimeToISO('20231231:2311')).toBe('2023-12-31T23:11:00')
  })

  it('returns input unchanged for unrecognised formats', () => {
    expect(pvgisTimeToISO('unknown')).toBe('unknown')
  })
})

// --- pvgisTimeToCopenhagenHour ---

describe('pvgisTimeToCopenhagenHour — UTC → Copenhagen local time', () => {
  it('adds 1 hour in winter (CET = UTC+1)', () => {
    // 00:00 UTC Jan 1 = 01:00 CET
    expect(pvgisTimeToCopenhagenHour('20230101:0000')).toBe('2023-01-01T01')
  })

  it('adds 2 hours in summer (CEST = UTC+2)', () => {
    // 10:00 UTC Jun 15 = 12:00 CEST
    expect(pvgisTimeToCopenhagenHour('20230615:1000')).toBe('2023-06-15T12')
  })

  it('handles DST spring-forward: UTC 01:00 Mar 26 → 03:00 CEST (02:00 skipped)', () => {
    // Mar 26 2023: clocks go 02:00 CET → 03:00 CEST at UTC 01:00
    expect(pvgisTimeToCopenhagenHour('20230326:0100')).toBe('2023-03-26T03')
  })

  it('handles DST fall-back: UTC 01:00 Oct 29 → 02:00 CET', () => {
    // Oct 29 2023: clocks go 03:00 CEST → 02:00 CET at UTC 01:00
    expect(pvgisTimeToCopenhagenHour('20231029:0100')).toBe('2023-10-29T02')
  })
})

// --- fetchPVGISData ---

describe('fetchPVGISData', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('parses hourly entries from real API response shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRealPVGISResponse(3),
    }))

    const data = await fetchPVGISData(COORDS, CONFIG)

    expect(data.hourly).toHaveLength(3)
    expect(data.hourly[0]).toMatchObject({ P: 0, G_i: 0, T2m: 5 })
    expect(data.hourly[2]).toMatchObject({ P: 2000, G_i: 400 })
  })

  it('derives annualKwh by summing hourly P — no totals field needed', async () => {
    // This test would have caught the original bug: json.outputs.totals.fixed.E_y
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRealPVGISResponse(4),
    }))

    const data = await fetchPVGISData(COORDS, CONFIG)

    // P values: 0, 1000, 2000, 3000 W → 0+1+2+3 = 6 kWh
    expect(data.annualKwh).toBeCloseTo(6)
  })

  it('converts time strings to ISO format', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRealPVGISResponse(1),
    }))

    const data = await fetchPVGISData(COORDS, CONFIG)
    // pvgisTimeToISO is called in simulation, but we verify the raw time is preserved
    expect(data.hourly[0].time).toBe('20230101:0000')
  })

  it('includes startyear and endyear in request to limit to one year', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRealPVGISResponse(1),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchPVGISData(COORDS, CONFIG)

    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('startyear=')
    expect(url).toContain('endyear=')
    // Both should be the same year
    const startyear = new URLSearchParams(url.split('?')[1]).get('startyear')
    const endyear = new URLSearchParams(url.split('?')[1]).get('endyear')
    expect(startyear).toBe(endyear)
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    await expect(fetchPVGISData(COORDS, CONFIG)).rejects.toThrow('400')
  })
})
