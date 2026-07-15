import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, MAX_SEGMENTS, defaultExistingSolarConfig } from '@/store/appStore'

// Reset to defaults before every test to ensure isolation
beforeEach(() => {
  useAppStore.getState().reset()
})

describe('appStore — initial state', () => {
  it('starts with correct defaults', () => {
    const s = useAppStore.getState()
    expect(s.address).toBe('')
    expect(s.postcode).toBe('')
    expect(s.coordinates).toBeNull()
    expect(s.solarConfig.systemLossPct).toBe(14)
    expect(s.solarConfig.segments).toHaveLength(1)
    expect(s.solarConfig.segments[0]).toMatchObject({ inputMode: 'capacity', peakKw: 6, tiltDeg: 35, azimuthDeg: 0 })
    expect(typeof s.solarConfig.segments[0].id).toBe('string')
    expect(s.consumption).toEqual({ source: 'manual', annualKwh: 5000 })
    expect(s.priceArea).toBe('DK2')
    expect(s.investmentDkk).toBe(60000)
    expect(s.fixedSpotDkk).toBeNull()
    expect(s.heatpumpEnabled).toBe(false)
    expect(s.evKmPerDay).toBeNull()
    expect(s.batteryConfig).toBeNull()
    expect(s.existingSolarConfig).toBeNull()
    expect(s.pvgisData).toBeNull()
    expect(s.simulationResult).toBeNull()
  })
})

describe('appStore — setters', () => {
  it('setAddress', () => {
    useAppStore.getState().setAddress('Rådhuspladsen 1, København')
    expect(useAppStore.getState().address).toBe('Rådhuspladsen 1, København')
  })

  it('setPostcode', () => {
    useAppStore.getState().setPostcode('8000')
    expect(useAppStore.getState().postcode).toBe('8000')
  })

  it('setCoordinates', () => {
    useAppStore.getState().setCoordinates({ lat: 55.67, lon: 12.57 })
    expect(useAppStore.getState().coordinates).toEqual({ lat: 55.67, lon: 12.57 })
  })

  it('setCoordinates(null) clears coordinates', () => {
    useAppStore.getState().setCoordinates({ lat: 55.67, lon: 12.57 })
    useAppStore.getState().setCoordinates(null)
    expect(useAppStore.getState().coordinates).toBeNull()
  })

  it('setSystemLossPct updates only the loss percentage', () => {
    useAppStore.getState().setSystemLossPct(10)
    const c = useAppStore.getState().solarConfig
    expect(c.systemLossPct).toBe(10)
    expect(c.segments).toHaveLength(1)
  })

  it('updateSolarSegment merges a partial update into the matching segment', () => {
    const id = useAppStore.getState().solarConfig.segments[0].id
    useAppStore.getState().updateSolarSegment(id, { peakKw: 10 })
    const seg = useAppStore.getState().solarConfig.segments[0]
    expect(seg.peakKw).toBe(10)
    expect(seg.tiltDeg).toBe(35)     // unchanged
    expect(seg.azimuthDeg).toBe(0)   // unchanged
  })

  it('updateSolarSegment handles multiple fields', () => {
    const id = useAppStore.getState().solarConfig.segments[0].id
    useAppStore.getState().updateSolarSegment(id, { tiltDeg: 20, azimuthDeg: 90 })
    const seg = useAppStore.getState().solarConfig.segments[0]
    expect(seg.tiltDeg).toBe(20)
    expect(seg.azimuthDeg).toBe(90)
    expect(seg.peakKw).toBe(6) // unchanged
  })

  it('addSolarSegment appends a new segment, up to MAX_SEGMENTS', () => {
    const { addSolarSegment } = useAppStore.getState()
    addSolarSegment()
    expect(useAppStore.getState().solarConfig.segments).toHaveLength(2)
    addSolarSegment()
    expect(useAppStore.getState().solarConfig.segments).toHaveLength(3)
    addSolarSegment() // beyond MAX_SEGMENTS — no-op
    expect(useAppStore.getState().solarConfig.segments).toHaveLength(MAX_SEGMENTS)
  })

  it('addSolarSegment assigns distinct ids and an east/west-leaning azimuth', () => {
    useAppStore.getState().addSolarSegment()
    const segments = useAppStore.getState().solarConfig.segments
    expect(segments[1].id).not.toBe(segments[0].id)
    expect(segments[1].azimuthDeg).toBe(-90)
  })

  it('removeSolarSegment removes the matching segment but never the last one', () => {
    useAppStore.getState().addSolarSegment()
    const secondId = useAppStore.getState().solarConfig.segments[1].id
    useAppStore.getState().removeSolarSegment(secondId)
    expect(useAppStore.getState().solarConfig.segments).toHaveLength(1)

    const lastId = useAppStore.getState().solarConfig.segments[0].id
    useAppStore.getState().removeSolarSegment(lastId)
    expect(useAppStore.getState().solarConfig.segments).toHaveLength(1) // guarded — cannot remove the only segment
  })

  it('setInvestmentDkk', () => {
    useAppStore.getState().setInvestmentDkk(120000)
    expect(useAppStore.getState().investmentDkk).toBe(120000)
  })

  it('setFixedSpotDkk sets a value', () => {
    useAppStore.getState().setFixedSpotDkk(0.75)
    expect(useAppStore.getState().fixedSpotDkk).toBe(0.75)
  })

  it('setFixedSpotDkk(null) disables fixed price', () => {
    useAppStore.getState().setFixedSpotDkk(0.75)
    useAppStore.getState().setFixedSpotDkk(null)
    expect(useAppStore.getState().fixedSpotDkk).toBeNull()
  })

  it('setHeatpumpEnabled toggles', () => {
    useAppStore.getState().setHeatpumpEnabled(true)
    expect(useAppStore.getState().heatpumpEnabled).toBe(true)
    useAppStore.getState().setHeatpumpEnabled(false)
    expect(useAppStore.getState().heatpumpEnabled).toBe(false)
  })

  it('setEvKmPerDay sets km value', () => {
    useAppStore.getState().setEvKmPerDay(80)
    expect(useAppStore.getState().evKmPerDay).toBe(80)
  })

  it('setEvKmPerDay(null) disables EV', () => {
    useAppStore.getState().setEvKmPerDay(80)
    useAppStore.getState().setEvKmPerDay(null)
    expect(useAppStore.getState().evKmPerDay).toBeNull()
  })

  it('setBatteryConfig stores config', () => {
    const battery = {
      capacityKwh: 10,
      maxChargeKw: 3.7,
      maxDischargeKw: 3.7,
      roundTripEfficiencyPct: 90,
      strategy: 'self-consumption' as const,
    }
    useAppStore.getState().setBatteryConfig(battery)
    expect(useAppStore.getState().batteryConfig).toEqual(battery)
  })

  it('setBatteryConfig(null) disables battery', () => {
    useAppStore.getState().setBatteryConfig({
      capacityKwh: 10, maxChargeKw: 3.7, maxDischargeKw: 3.7,
      roundTripEfficiencyPct: 90, strategy: 'self-consumption',
    })
    useAppStore.getState().setBatteryConfig(null)
    expect(useAppStore.getState().batteryConfig).toBeNull()
  })

  it('setExistingSolarConfig stores config', () => {
    const cfg = defaultExistingSolarConfig()
    useAppStore.getState().setExistingSolarConfig(cfg)
    expect(useAppStore.getState().existingSolarConfig).toEqual(cfg)
  })

  it('setExistingSystemLossPct is a no-op when existing solar is disabled', () => {
    useAppStore.getState().setExistingSystemLossPct(8)
    expect(useAppStore.getState().existingSolarConfig).toBeNull()
  })

  it('addExistingSegment / removeExistingSegment / updateExistingSegment operate on existingSolarConfig', () => {
    useAppStore.getState().setExistingSolarConfig(defaultExistingSolarConfig())
    useAppStore.getState().addExistingSegment()
    expect(useAppStore.getState().existingSolarConfig?.segments).toHaveLength(2)

    const id = useAppStore.getState().existingSolarConfig!.segments[0].id
    useAppStore.getState().updateExistingSegment(id, { peakKw: 4 })
    expect(useAppStore.getState().existingSolarConfig!.segments[0].peakKw).toBe(4)

    const secondId = useAppStore.getState().existingSolarConfig!.segments[1].id
    useAppStore.getState().removeExistingSegment(secondId)
    expect(useAppStore.getState().existingSolarConfig?.segments).toHaveLength(1)
  })

  it('setConsumption merges partial update', () => {
    useAppStore.getState().setConsumption({ annualKwh: 8000 })
    const c = useAppStore.getState().consumption
    expect(c.annualKwh).toBe(8000)
    expect(c.source).toBe('manual') // unchanged
  })

  it('setConsumption can update source', () => {
    useAppStore.getState().setConsumption({ source: 'eloverblik', annualKwh: 7200 })
    const c = useAppStore.getState().consumption
    expect(c.source).toBe('eloverblik')
    expect(c.annualKwh).toBe(7200)
  })
})

describe('appStore — reset', () => {
  it('restores all fields to defaults after modifications', () => {
    const store = useAppStore.getState()
    store.setAddress('Testvej 1')
    store.setPostcode('2100')
    store.setCoordinates({ lat: 56.15, lon: 10.20 })
    store.setInvestmentDkk(150000)
    store.setFixedSpotDkk(0.60)
    store.setHeatpumpEnabled(true)
    store.setEvKmPerDay(80)
    store.updateSolarSegment(store.solarConfig.segments[0].id, { peakKw: 12 })
    store.setBatteryConfig({ capacityKwh: 10, maxChargeKw: 5, maxDischargeKw: 5, roundTripEfficiencyPct: 90, strategy: 'self-consumption' })
    store.setExistingSolarConfig(defaultExistingSolarConfig())

    store.reset()

    const s = useAppStore.getState()
    expect(s.address).toBe('')
    expect(s.postcode).toBe('')
    expect(s.coordinates).toBeNull()
    expect(s.investmentDkk).toBe(60000)
    expect(s.fixedSpotDkk).toBeNull()
    expect(s.heatpumpEnabled).toBe(false)
    expect(s.evKmPerDay).toBeNull()
    expect(s.solarConfig.systemLossPct).toBe(14)
    expect(s.solarConfig.segments).toHaveLength(1)
    expect(s.solarConfig.segments[0]).toMatchObject({ inputMode: 'capacity', peakKw: 6, tiltDeg: 35, azimuthDeg: 0 })
    expect(s.batteryConfig).toBeNull()
    expect(s.existingSolarConfig).toBeNull()
    expect(s.pvgisData).toBeNull()
    expect(s.simulationResult).toBeNull()
    expect(s.consumption).toEqual({ source: 'manual', annualKwh: 5000 })
  })
})

describe('appStore — partialize (persistence whitelist)', () => {
  it('does not persist pvgisData or simulationResult', () => {
    // The persist middleware's partialize function explicitly excludes these.
    // Verify by checking they are absent from the persisted subset.
    const state = useAppStore.getState()
    // Access the persist api to check what would be stored
    const persisted = (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => object } } })
      .persist?.getOptions?.()?.partialize?.(state)

    if (persisted) {
      expect(persisted).not.toHaveProperty('pvgisData')
      expect(persisted).not.toHaveProperty('simulationResult')
    }
  })

  it('persists consumption without hourlyKwh', () => {
    const state = useAppStore.getState()
    state.setConsumption({ source: 'eloverblik', annualKwh: 7200, hourlyKwh: [1, 2, 3] })

    const persisted = (useAppStore as unknown as { persist: { getOptions: () => { partialize: (s: typeof state) => Record<string, unknown> } } })
      .persist?.getOptions?.()?.partialize?.(useAppStore.getState())

    if (persisted && persisted.consumption) {
      const consumption = persisted.consumption as Record<string, unknown>
      expect(consumption.annualKwh).toBe(7200)
      expect(consumption).not.toHaveProperty('hourlyKwh')
    }
  })
})
