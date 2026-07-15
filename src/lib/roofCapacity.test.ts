import { describe, it, expect } from 'vitest'
import { estimateCapacityKw, estimatePanelCount, getSegmentPeakKw, DEFAULT_PANEL } from './roofCapacity'
import type { RoofSegment } from '@/types'

describe('estimateCapacityKw', () => {
  it('computes capacity from usable area / panel area * wattage', () => {
    // 10m x 6m roof, 85% usable = 51 m². Default panel area ~2.576 m².
    // floor(51 / 2.576) = 19 panels * 440 Wp = 8.36 kW
    const kw = estimateCapacityKw(10, 6, DEFAULT_PANEL)
    expect(kw).toBeCloseTo(8.36, 1)
  })

  it('scales with usableFraction', () => {
    const full = estimateCapacityKw(10, 6, DEFAULT_PANEL, 1)
    const half = estimateCapacityKw(10, 6, DEFAULT_PANEL, 0.5)
    expect(half).toBeLessThan(full)
  })

  it('returns 0 for a roof smaller than one panel', () => {
    expect(estimateCapacityKw(1, 1, DEFAULT_PANEL)).toBe(0)
  })

  it('supports a custom panel spec', () => {
    const smallPanel = { wattage: 300, widthM: 1, heightM: 1.6 }
    const kw = estimateCapacityKw(10, 6, smallPanel)
    // usable area 51 m², panel area 1.6 m² -> floor(31.875) = 31 panels * 300W
    expect(kw).toBeCloseTo(9.3, 1)
  })
})

describe('estimatePanelCount', () => {
  it('matches the panel count implied by estimateCapacityKw', () => {
    const count = estimatePanelCount(10, 6, DEFAULT_PANEL)
    expect(count).toBe(19)
    expect(estimateCapacityKw(10, 6, DEFAULT_PANEL)).toBeCloseTo((count * DEFAULT_PANEL.wattage) / 1000)
  })
})

describe('getSegmentPeakKw', () => {
  const base: RoofSegment = {
    id: 's1',
    inputMode: 'capacity',
    tiltDeg: 35,
    azimuthDeg: 0,
    peakKw: 6,
  }

  it('returns stored peakKw in capacity mode', () => {
    expect(getSegmentPeakKw(base)).toBe(6)
  })

  it('derives capacity from dimensions in dimensions mode', () => {
    const seg: RoofSegment = {
      ...base,
      inputMode: 'dimensions',
      roofWidthM: 10,
      roofHeightM: 6,
    }
    expect(getSegmentPeakKw(seg)).toBeCloseTo(8.36, 1)
  })

  it('uses a custom panel spec when provided in dimensions mode', () => {
    const seg: RoofSegment = {
      ...base,
      inputMode: 'dimensions',
      roofWidthM: 10,
      roofHeightM: 6,
      panelWattage: 300,
      panelWidthM: 1,
      panelHeightM: 1.6,
    }
    expect(getSegmentPeakKw(seg)).toBeCloseTo(9.3, 1)
  })

  it('falls back to peakKw in dimensions mode when dimensions are missing', () => {
    const seg: RoofSegment = { ...base, inputMode: 'dimensions', peakKw: 4 }
    expect(getSegmentPeakKw(seg)).toBe(4)
  })
})
