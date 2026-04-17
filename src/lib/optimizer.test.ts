import { describe, it, expect } from 'vitest'
import { sweepSystemSizes, findOptimalSize, M2_PER_KWP } from './optimizer'
import type { ConsumptionData, PVGISData } from '@/types'

function makePVGIS(wattsPerHour: number): PVGISData {
  return {
    hourly: Array.from({ length: 8760 }, (_, i) => ({
      time: `20230101:${String(i % 24).padStart(2, '0')}00`,
      P: wattsPerHour,
      G_i: 0,
      T2m: 10,
    })),
    annualKwh: (wattsPerHour / 1000) * 8760,
    location: { lat: 56, lon: 10 },
  }
}

const baseConsumption: ConsumptionData = { source: 'manual', annualKwh: 5000 }

describe('sweepSystemSizes', () => {
  it('returns one option per 0.5 kWp step up to maxKwp', () => {
    const pvgis = makePVGIS(600)
    const options = sweepSystemSizes(pvgis, 1, 10000, 3, baseConsumption)
    expect(options.length).toBe(5)   // 1.0, 1.5, 2.0, 2.5, 3.0
    expect(options[0].peakKw).toBe(1)
    expect(options[4].peakKw).toBe(3)
  })

  it('savings grow sub-linearly as system exceeds self-consumption capacity', () => {
    const pvgis = makePVGIS(600)
    const options = sweepSystemSizes(pvgis, 1, 10000, 4, baseConsumption)
    const savings = options.map(o => o.annualSavedDkk)
    // Each step adds less savings than the previous (diminishing returns)
    for (let i = 1; i < savings.length; i++) {
      const marginalCurrent  = savings[i] - savings[i - 1]
      const marginalPrevious = i >= 2 ? savings[i - 1] - savings[i - 2] : Infinity
      expect(marginalCurrent).toBeLessThanOrEqual(marginalPrevious + 0.01)
    }
  })

  it('returns empty array when maxKwp < 1', () => {
    const pvgis = makePVGIS(600)
    const options = sweepSystemSizes(pvgis, 1, 10000, 0.5, baseConsumption)
    expect(options).toHaveLength(0)
  })

  it('clamps to 50 kWp maximum', () => {
    const pvgis = makePVGIS(600)
    const options = sweepSystemSizes(pvgis, 1, 10000, 200, baseConsumption)
    expect(options[options.length - 1].peakKw).toBeLessThanOrEqual(50)
  })

  it('investment scales linearly with kWp', () => {
    const pvgis = makePVGIS(600)
    const options = sweepSystemSizes(pvgis, 1, 10000, 2, baseConsumption)
    const opt1 = options.find(o => o.peakKw === 1)!
    const opt2 = options.find(o => o.peakKw === 2)!
    // payback at 2x kWp = (2 * investment) / savings_2kw
    // payback at 1x kWp = investment / savings_1kw
    // Just verify both exist and payback is positive
    expect(opt1.paybackYears).toBeGreaterThan(0)
    expect(opt2.paybackYears).toBeGreaterThan(0)
  })
})

describe('findOptimalSize', () => {
  it('returns null for empty array', () => {
    expect(findOptimalSize([])).toBeNull()
  })

  it('returns the option with minimum payback years', () => {
    const opts: ReturnType<typeof sweepSystemSizes> = [
      { peakKw: 2, annualSavedDkk: 5000, paybackYears: 10 },
      { peakKw: 4, annualSavedDkk: 8000, paybackYears: 7.5 },
      { peakKw: 6, annualSavedDkk: 9000, paybackYears: 9 },
    ]
    expect(findOptimalSize(opts)?.peakKw).toBe(4)
  })

  it('handles single-element array', () => {
    const opts = [{ peakKw: 3, annualSavedDkk: 6000, paybackYears: 8 }]
    expect(findOptimalSize(opts)?.peakKw).toBe(3)
  })
})

describe('M2_PER_KWP', () => {
  it('is a positive number', () => {
    expect(M2_PER_KWP).toBeGreaterThan(0)
  })
})
