import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EUR_TO_DKK, VAT_MULTIPLIER, FEED_IN_MULTIPLIER, fetchSpotPrices, fetchCO2Emissions } from './energidataservice'

describe('EUR_TO_DKK', () => {
  it('is a positive number close to the DKK/EUR peg', () => {
    expect(EUR_TO_DKK).toBeGreaterThan(7)
    expect(EUR_TO_DKK).toBeLessThan(8)
  })
})

describe('VAT_MULTIPLIER', () => {
  it('is exported and equals 1.25 (25% Danish VAT)', () => {
    expect(VAT_MULTIPLIER).toBe(1.25)
  })
})

describe('FEED_IN_MULTIPLIER', () => {
  it('is exported and is between 0 and 1 (fraction of spot price for exports)', () => {
    expect(FEED_IN_MULTIPLIER).toBeGreaterThan(0)
    expect(FEED_IN_MULTIPLIER).toBeLessThanOrEqual(1)
    expect(FEED_IN_MULTIPLIER).toBe(0.90)
  })
})

describe('fetchSpotPrices', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps API records to HourlyPrice with correct unit conversion', async () => {
    const mockRecords = [
      { HourDK: '2024-01-01T00:00:00', SpotPriceEUR: 80 },
      { HourDK: '2024-01-01T01:00:00', SpotPriceEUR: null },  // missing → 0
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: mockRecords }),
    }))

    const prices = await fetchSpotPrices(2024, 'DK2')

    expect(prices).toHaveLength(2)
    expect(prices[0].hourStart).toBe('2024-01-01T00:00:00')
    expect(prices[0].spotEur).toBe(80)
    expect(prices[0].tariffDkk).toBe(1.40)
    expect(prices[1].spotEur).toBe(0)  // null coerced to 0
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    await expect(fetchSpotPrices(2024, 'DK1')).rejects.toThrow('503')
  })

  it('throws when records array is missing from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ /* no records key */ }),
    }))
    await expect(fetchSpotPrices(2024, 'DK2')).rejects.toThrow()
  })

  it('includes correct year range in request URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchSpotPrices(2023, 'DK1')

    const calledUrl: string = mockFetch.mock.calls[0][0]
    // URLSearchParams encodes colons, so T00:00 → T00%3A00
    expect(calledUrl).toContain('2023-01-01T00%3A00')
    expect(calledUrl).toContain('2024-01-01T00%3A00')
  })
})

describe('fetchCO2Emissions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps records to kg/kWh (divides g/kWh by 1000)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          { CO2Emission: 130 },  // 130 g/kWh → 0.130 kg/kWh
          { CO2Emission: 50 },   // 50 g/kWh  → 0.050 kg/kWh
        ],
      }),
    }))

    const factors = await fetchCO2Emissions(2024, 'DK2')

    expect(factors).toHaveLength(2)
    expect(factors[0]).toBeCloseTo(0.130)
    expect(factors[1]).toBeCloseTo(0.050)
  })

  it('falls back to 130 g/kWh when CO2Emission is null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [{ CO2Emission: null }] }),
    }))

    const factors = await fetchCO2Emissions(2024, 'DK2')

    expect(factors[0]).toBeCloseTo(0.130)  // 130 / 1000
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchCO2Emissions(2024, 'DK1')).rejects.toThrow('500')
  })

  it('throws when records array is missing from response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ /* no records key */ }),
    }))
    await expect(fetchCO2Emissions(2024, 'DK2')).rejects.toThrow()
  })

  it('includes correct year range and price area in URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchCO2Emissions(2023, 'DK1')

    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('2023-01-01T00%3A00')
    expect(calledUrl).toContain('2024-01-01T00%3A00')
    expect(calledUrl).toContain('DK1')
  })
})
