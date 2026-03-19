import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseConsumptionResponse,
  fetchDataAccessToken,
  fetchMeteringPointId,
  fetchAllMeteringPoints,
  findExportPoint,
  clearTokenCache,
} from './eloverblik'

// --- parseConsumptionResponse ---

function makePeriod(utcStart: string, hourlyKwh: number[]) {
  return {
    timeInterval: { start: utcStart, end: '' },
    resolution: 'PT1H',
    Point: hourlyKwh.map((kwh, i) => ({
      position: String(i + 1),
      'out_Quantity.quantity': String(kwh),
      'out_Quantity.quality': 'E01',
    })),
  }
}

function makeResponse(periods: ReturnType<typeof makePeriod>[]) {
  return {
    result: [{
      MyEnergyData_MarketDocument: {
        TimeSeries: [{ Period: periods }],
      },
    }],
  }
}

describe('parseConsumptionResponse', () => {
  it('returns 8760 hourly values for a non-leap year', () => {
    // Build 365 days × 24 hours for 2023
    // 2023 starts: Dec 31 2022 23:00 UTC = Jan 1 2023 00:00 CET
    const periods = []
    for (let day = 0; day < 365; day++) {
      const ms = Date.UTC(2022, 11, 31, 23, 0, 0) + day * 24 * 3_600_000
      const utcStart = new Date(ms).toISOString()
      periods.push(makePeriod(utcStart, Array(24).fill(1.0)))
    }

    const { hourlyKwh, annualKwh } = parseConsumptionResponse(makeResponse(periods), 2023)

    expect(hourlyKwh).toHaveLength(8760)
    expect(annualKwh).toBeCloseTo(8760)
  })

  it('preserves correct kWh values at known UTC hours', () => {
    // Single period: Jan 1 00:00 CET (= Dec 31 2022 23:00 UTC), 3 hours
    const period = makePeriod('2022-12-31T23:00:00.000Z', [1.5, 2.0, 0.5])
    const { hourlyKwh } = parseConsumptionResponse(makeResponse([period]), 2023)

    expect(hourlyKwh[0]).toBeCloseTo(1.5)  // h=0: Jan 1 00:00 CET
    expect(hourlyKwh[1]).toBeCloseTo(2.0)  // h=1: Jan 1 01:00 CET
    expect(hourlyKwh[2]).toBeCloseTo(0.5)  // h=2: Jan 1 02:00 CET
  })

  it('fills missing hours with 0', () => {
    // Only provide one hour of data
    const period = makePeriod('2022-12-31T23:00:00.000Z', [3.0])
    const { hourlyKwh } = parseConsumptionResponse(makeResponse([period]), 2023)

    expect(hourlyKwh[0]).toBeCloseTo(3.0)
    expect(hourlyKwh[1]).toBe(0)
    expect(hourlyKwh[8759]).toBe(0)
  })

  it('throws on invalid/empty response', () => {
    expect(() => parseConsumptionResponse({}, 2023)).toThrow('Ugyldigt dataformat')
    expect(() => parseConsumptionResponse({ result: [] }, 2023)).toThrow('Ugyldigt dataformat')
  })

  it('handles 8784 hours for a leap year (2024)', () => {
    const periods = []
    for (let day = 0; day < 366; day++) {
      const ms = Date.UTC(2023, 11, 31, 23, 0, 0) + day * 24 * 3_600_000
      periods.push(makePeriod(new Date(ms).toISOString(), Array(24).fill(0.5)))
    }

    const { hourlyKwh } = parseConsumptionResponse(makeResponse(periods), 2024)
    expect(hourlyKwh).toHaveLength(8784)
  })

  it('annualKwh is sum of all hourly values', () => {
    const period = makePeriod('2022-12-31T23:00:00.000Z', [2, 3, 5])
    const { annualKwh } = parseConsumptionResponse(makeResponse([period]), 2023)
    expect(annualKwh).toBeCloseTo(10)
  })
})

// --- fetchDataAccessToken ---

describe('fetchDataAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearTokenCache()
  })

  it('returns token from API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'data-token-abc' }),
    }))

    const token = await fetchDataAccessToken('my-refresh-token')
    expect(token).toBe('data-token-abc')
  })

  it('throws with status on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(fetchDataAccessToken('bad-token')).rejects.toThrow('401')
  })

  it('caches the data access token and avoids second fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'cached-token' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchDataAccessToken('refresh')
    await fetchDataAccessToken('refresh')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// --- fetchMeteringPointId ---

describe('fetchMeteringPointId', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns E17 metering point ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: [{ meteringPointId: '571313174000012345', typeOfMP: 'E17' }] }),
    }))

    const id = await fetchMeteringPointId('data-token')
    expect(id).toBe('571313174000012345')
  })

  it('throws when no metering points found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: [] }),
    }))

    await expect(fetchMeteringPointId('data-token')).rejects.toThrow('Ingen målepunkter')
  })
})

// --- fetchAllMeteringPoints ---

describe('fetchAllMeteringPoints', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('maps address fields onto returned objects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [{
          meteringPointId: '111',
          typeOfMP: 'E17',
          streetName: 'Testvej',
          buildingNumber: '1',
          postcode: '8000',
          cityName: 'Aarhus C',
        }],
      }),
    }))

    const points = await fetchAllMeteringPoints('data-token')
    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({
      meteringPointId: '111',
      typeOfMP: 'E17',
      streetName: 'Testvej',
      postcode: '8000',
      cityName: 'Aarhus C',
    })
  })

  it('returns multiple metering points', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [
          { meteringPointId: '111', typeOfMP: 'E17', postcode: '8000' },
          { meteringPointId: '222', typeOfMP: 'E17', postcode: '9000' },
          { meteringPointId: '333', typeOfMP: 'E18', postcode: '8000' },
        ],
      }),
    }))

    const points = await fetchAllMeteringPoints('data-token')
    expect(points).toHaveLength(3)
  })

  it('maps parentMeteringPoint.meteringPointId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: [{
          meteringPointId: '333',
          typeOfMP: 'E18',
          parentMeteringPoint: { meteringPointId: '111' },
        }],
      }),
    }))

    const points = await fetchAllMeteringPoints('data-token')
    expect(points[0].parentMeteringPointId).toBe('111')
  })
})

// --- findExportPoint ---

describe('findExportPoint', () => {
  it('finds E18 by parentMeteringPointId', () => {
    const points = [
      { meteringPointId: '111', typeOfMP: 'E17', postcode: '8000' },
      { meteringPointId: '333', typeOfMP: 'E18', postcode: '8000', parentMeteringPointId: '111' },
    ]
    expect(findExportPoint(points, '111')?.meteringPointId).toBe('333')
  })

  it('falls back to address match when no parent link', () => {
    const points = [
      { meteringPointId: '111', typeOfMP: 'E17', postcode: '8000', streetName: 'Testvej' },
      { meteringPointId: '333', typeOfMP: 'E18', postcode: '8000', streetName: 'Testvej' },
    ]
    expect(findExportPoint(points, '111')?.meteringPointId).toBe('333')
  })

  it('returns null when no E18 present', () => {
    const points = [{ meteringPointId: '111', typeOfMP: 'E17', postcode: '8000' }]
    expect(findExportPoint(points, '111')).toBeNull()
  })

  it('does not match E18 from a different address', () => {
    const points = [
      { meteringPointId: '111', typeOfMP: 'E17', postcode: '8000', streetName: 'Testvej' },
      { meteringPointId: '333', typeOfMP: 'E18', postcode: '9000', streetName: 'Andenvej' },
    ]
    expect(findExportPoint(points, '111')).toBeNull()
  })
})
