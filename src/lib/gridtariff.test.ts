import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dsoFromPostcode, fetchGridTariff, ELAFGIFT_DKK, SYSTEM_TARIFF_DKK } from './gridtariff'

describe('dsoFromPostcode', () => {
  it('maps Copenhagen (1000–2999) to Radius', () => {
    expect(dsoFromPostcode('1000')?.name).toBe('Radius Elnet A/S')
    expect(dsoFromPostcode('2100')?.glnNumber).toBe('5790000705689')
    expect(dsoFromPostcode('2999')?.name).toBe('Radius Elnet A/S')
  })

  it('maps Sjælland (3000–4999) to Cerius', () => {
    expect(dsoFromPostcode('4000')?.name).toBe('Cerius A/S')
    expect(dsoFromPostcode('3700')?.name).toBe('Cerius A/S')  // Bornholm
  })

  it('maps Fyn (5000–5999) to Ravdex', () => {
    expect(dsoFromPostcode('5000')?.name).toBe('Ravdex A/S')
    expect(dsoFromPostcode('5210')?.name).toBe('Ravdex A/S')
  })

  it('maps South/West Jutland (6000–7999) to N1', () => {
    expect(dsoFromPostcode('6000')?.name).toBe('N1 A/S')
    expect(dsoFromPostcode('7400')?.name).toBe('N1 A/S')
  })

  it('maps Aarhus area (8000–8999) to Elnet Midt', () => {
    expect(dsoFromPostcode('8000')?.name).toBe('Elnet Midt A/S')
    expect(dsoFromPostcode('8200')?.name).toBe('Elnet Midt A/S')
  })

  it('maps North Jutland (9000–9999) to Nord Energi', () => {
    expect(dsoFromPostcode('9000')?.name).toBe('Nord Energi Net A/S')
  })

  it('returns null for invalid postcode', () => {
    expect(dsoFromPostcode('')).toBeNull()
    expect(dsoFromPostcode('abc')).toBeNull()
  })
})

describe('ELAFGIFT_DKK and SYSTEM_TARIFF_DKK', () => {
  it('elafgift is the 2024 national rate', () => {
    expect(ELAFGIFT_DKK).toBe(0.699)
  })

  it('system tariff is a small positive number', () => {
    expect(SYSTEM_TARIFF_DKK).toBeGreaterThan(0)
    expect(SYSTEM_TARIFF_DKK).toBeLessThan(0.2)
  })
})

describe('fetchGridTariff', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('extracts 24 hourly prices from a matching record', async () => {
    const today = new Date()
    const prices = Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [`Price${i + 1}`, 0.1 + i * 0.01])
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          {
            Note: 'Nettarif C',
            ResolutionDuration: 'PT1H',
            ValidFrom: new Date(today.getTime() - 86400000).toISOString(),
            ValidTo: null,
            ...prices,
          },
        ],
      }),
    }))

    const result = await fetchGridTariff('5790000705689')
    expect(result).toHaveLength(24)
    expect(result[0]).toBeCloseTo(0.10)
    expect(result[23]).toBeCloseTo(0.33)
  })

  it('throws when no active Nettarif C record found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
    }))

    await expect(fetchGridTariff('5790000705689')).rejects.toThrow('Ingen aktiv')
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchGridTariff('5790000705689')).rejects.toThrow('500')
  })

  it('filters out expired records (ValidTo in the past)', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          {
            Note: 'Nettarif C',
            ResolutionDuration: 'PT1H',
            ValidFrom: new Date(Date.now() - 172800000).toISOString(),
            ValidTo: pastDate,  // already expired
            ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`Price${i + 1}`, 0.1])),
          },
        ],
      }),
    }))

    await expect(fetchGridTariff('5790000705689')).rejects.toThrow('Ingen aktiv')
  })
})
