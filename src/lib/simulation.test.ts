import { describe, it, expect } from 'vitest'
import { runSimulation } from './simulation'
import type { ConsumptionData, HourlyPrice, PVGISData } from '@/types'

// --- Helpers ---

// Uses real PVGIS time format: "YYYYMMDD:HHMM"
function makePVGIS(hourlyWatts: number[]): PVGISData {
  return {
    hourly: hourlyWatts.map((P, i) => {
      const hh = String(i % 24).padStart(2, '0')
      return { time: `20230101:${hh}00`, P, G_i: 0, T2m: 10 }
    }),
    annualKwh: hourlyWatts.reduce((s, w) => s + w / 1000, 0),
    location: { lat: 56, lon: 10 },
  }
}

function flatConsumption(annualKwh: number): ConsumptionData {
  return { source: 'manual', annualKwh }
}

// --- runSimulation: energy flows ---

describe('runSimulation — energy flows', () => {
  it('zero production → zero self-consumption, zero savings', () => {
    const pvgis = makePVGIS([0, 0, 0])
    const result = runSimulation(pvgis, flatConsumption(3000))

    result.hourly.forEach(h => {
      expect(h.productionKwh).toBe(0)
      expect(h.selfConsumedKwh).toBe(0)
      expect(h.gridExportKwh).toBe(0)
      expect(h.savedDkk).toBe(0)
    })
    expect(result.summary.annualProductionKwh).toBe(0)
    expect(result.summary.selfConsumptionPct).toBe(0)
    expect(result.summary.coveragePct).toBe(0)
  })

  it('production > consumption → all production self-consumed or exported', () => {
    // 2000 W production, 500 W consumption (flat over 2 hours = 1 kWh/h)
    const annualKwh = (500 / 1000) * 2  // 2 hours
    const pvgis = makePVGIS([2000, 2000])
    const result = runSimulation(pvgis, { source: 'manual', annualKwh, hourlyKwh: [1, 1] })

    result.hourly.forEach(h => {
      expect(h.selfConsumedKwh).toBeCloseTo(1)      // capped at consumption
      expect(h.gridExportKwh).toBeCloseTo(1)         // 2 - 1
      expect(h.gridImportKwh).toBeCloseTo(0)
    })
  })

  it('production < consumption → partial coverage, grid import', () => {
    const pvgis = makePVGIS([500, 500])  // 0.5 kWh/h production
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 2, hourlyKwh: [1, 1] })

    result.hourly.forEach(h => {
      expect(h.selfConsumedKwh).toBeCloseTo(0.5)
      expect(h.gridExportKwh).toBeCloseTo(0)
      expect(h.gridImportKwh).toBeCloseTo(0.5)
    })
  })

  it('production exactly equals consumption → 100% self-consumption, no import or export', () => {
    const pvgis = makePVGIS([1000, 1000])  // 1 kWh/h
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 2, hourlyKwh: [1, 1] })

    result.hourly.forEach(h => {
      expect(h.selfConsumedKwh).toBeCloseTo(1)
      expect(h.gridExportKwh).toBeCloseTo(0)
      expect(h.gridImportKwh).toBeCloseTo(0)
    })
    expect(result.summary.selfConsumptionPct).toBeCloseTo(100)
    expect(result.summary.coveragePct).toBeCloseTo(100)
  })
})

// --- runSimulation: consumption profiles ---

describe('runSimulation — consumption profiles', () => {
  it('flat profile distributes annual kWh evenly', () => {
    const n = 4
    const annualKwh = 8760  // exactly 1 kWh per hour for a year
    const pvgis = makePVGIS(Array(n).fill(0))
    const result = runSimulation(pvgis, { source: 'manual', annualKwh })

    const expectedHourly = annualKwh / n
    result.hourly.forEach(h => {
      expect(h.consumptionKwh).toBeCloseTo(expectedHourly)
    })
  })

  it('uses provided hourly profile when length matches', () => {
    const pvgis = makePVGIS([0, 0, 0])
    const hourlyKwh = [1.5, 2.0, 0.5]
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 4, hourlyKwh })

    result.hourly.forEach((h, i) => {
      expect(h.consumptionKwh).toBeCloseTo(hourlyKwh[i])
    })
  })

  it('falls back to flat profile when hourly length mismatches', () => {
    const pvgis = makePVGIS([0, 0, 0])
    // hourlyKwh has 2 entries but pvgis has 3 hours
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 6, hourlyKwh: [1, 2] })

    result.hourly.forEach(h => {
      expect(h.consumptionKwh).toBeCloseTo(2)  // 6 / 3
    })
  })
})

// --- runSimulation: savings calculation ---

describe('runSimulation — savings', () => {
  it('uses flat retail price (3.0 DKK/kWh) when no prices provided', () => {
    // 1 kWh production, 2 kWh consumption → 1 kWh self-consumed, 0 export
    const pvgis = makePVGIS([1000])
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 2, hourlyKwh: [2] })

    // savedDkk = 1 kWh * 3.0 DKK + 0 export * 0.10 DKK = 3.0
    expect(result.hourly[0].savedDkk).toBeCloseTo(3.0)
  })

  it('feed-in revenue added for grid export', () => {
    // 2 kWh production, 1 kWh consumption → 1 kWh self-consumed, 1 kWh export
    const pvgis = makePVGIS([2000])
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 1, hourlyKwh: [1] })

    // savedDkk = 1 * 3.0 + 1 * 0.10 = 3.10
    expect(result.hourly[0].savedDkk).toBeCloseTo(3.10)
  })

  it('uses spot price + tariff when prices are provided', () => {
    const pvgis = makePVGIS([1000])
    const prices: HourlyPrice[] = [{
      hourStart: '2024-01-01T00:00:00',
      spotEur: 100,     // 100 EUR/MWh = 0.1 EUR/kWh = 0.746 DKK/kWh
      tariffDkk: 1.40,  // realistic Danish fixed costs incl. elafgift, nettarif, etc.
    }]
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 1, hourlyKwh: [1] }, prices)

    // retail = (100/1000 * 7.46) * 1.25 + 1.40 = 0.746 * 1.25 + 1.40 = 0.9325 + 1.40 = 2.3325 DKK/kWh
    // 1 kWh self-consumed → savedDkk = 2.3325
    expect(result.hourly[0].savedDkk).toBeCloseTo(2.3325)
  })

  it('applies different tariffDkk per hour (hourly nettarif)', () => {
    // Two hours: off-peak (low tariff) and peak (high tariff)
    const pvgis = makePVGIS([1000, 1000])  // 1 kWh production each hour
    const prices: HourlyPrice[] = [
      { hourStart: '2024-01-01T00:00:00', spotEur: 0, tariffDkk: 1.00 },  // off-peak
      { hourStart: '2024-01-01T01:00:00', spotEur: 0, tariffDkk: 2.50 },  // peak
    ]
    const result = runSimulation(pvgis, { source: 'manual', annualKwh: 2, hourlyKwh: [1, 1] }, prices)

    // spotEur=0 → spotDkk=0 → retail = 0 * 1.25 + tariffDkk
    expect(result.hourly[0].savedDkk).toBeCloseTo(1.00)  // off-peak hour
    expect(result.hourly[1].savedDkk).toBeCloseTo(2.50)  // peak hour
    // Annual savings = sum of both
    expect(result.summary.annualSavedDkk).toBeCloseTo(3.50)
  })
})

// --- runSimulation: summary ---

describe('runSimulation — summary', () => {
  it('annualProductionKwh sums all hourly production', () => {
    const pvgis = makePVGIS([1000, 2000, 3000])  // 1+2+3 = 6 kWh
    const result = runSimulation(pvgis, flatConsumption(99999))
    expect(result.summary.annualProductionKwh).toBeCloseTo(6)
  })

  it('selfConsumptionPct is 0 when production is 0', () => {
    const pvgis = makePVGIS([0, 0])
    const result = runSimulation(pvgis, flatConsumption(1000))
    expect(result.summary.selfConsumptionPct).toBe(0)
  })

  it('coveragePct is 0 when consumption is 0', () => {
    const pvgis = makePVGIS([1000, 1000])
    const result = runSimulation(pvgis, flatConsumption(0))
    expect(result.summary.coveragePct).toBe(0)
  })

  it('paybackYears is null (set externally)', () => {
    const pvgis = makePVGIS([1000])
    const result = runSimulation(pvgis, flatConsumption(5000))
    expect(result.summary.paybackYears).toBeNull()
  })
})
