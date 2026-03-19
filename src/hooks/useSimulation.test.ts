import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PVGISData, SimulationResult } from '@/types'

// --- Module mocks (hoisted by Vitest) ---

// Replace React's useState with a simple stub so the hook can run outside React context.
// isLoading and error setters become no-ops; their values stay at the initial value.
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return { ...actual, useState: (initial: unknown) => [initial, vi.fn()] }
})

vi.mock('@/store/appStore')
vi.mock('@/lib/pvgis')
vi.mock('@/lib/energidataservice')
vi.mock('@/lib/gridtariff')
vi.mock('@/lib/simulation')

// --- Imports after mocks ---

import { useAppStore } from '@/store/appStore'
import { fetchPVGISData } from '@/lib/pvgis'
import { fetchSpotPrices, fetchCO2Emissions } from '@/lib/energidataservice'
import { fetchGridTariff, dsoFromPostcode } from '@/lib/gridtariff'
import { runSimulation } from '@/lib/simulation'
import { useSimulation } from '@/hooks/useSimulation'

// --- Shared fixtures ---

function makePVGIS(watts = 1000, hours = 24): PVGISData {
  return {
    hourly: Array.from({ length: hours }, (_, i) => ({
      time: `20230101:${String(i % 24).padStart(2, '0')}00`,
      P: watts,
      G_i: 500,
      T2m: 10,
    })),
    annualKwh: (watts / 1000) * hours,
    location: { lat: 56, lon: 10 },
  }
}

const MOCK_RESULT: SimulationResult = {
  hourly: [],
  summary: {
    annualProductionKwh: 24,
    annualConsumptionKwh: 5000,
    selfConsumptionPct: 80,
    coveragePct: 30,
    annualSavedDkk: 5000,
    co2SavedKg: 3.1,
    paybackYears: null,
  },
}

const DEFAULT_STORE = {
  coordinates: { lat: 56.15, lon: 10.20 },
  postcode: '2100',
  solarConfig: { peakKw: 6, tiltDeg: 35, azimuthDeg: 0, systemLossPct: 5 },
  consumption: { source: 'manual' as const, annualKwh: 5000 },
  priceArea: 'DK2' as const,
  fixedSpotDkk: null,
  heatpumpEnabled: false,
  evKmPerDay: null,
  batteryConfig: null,
  existingSolarConfig: null,
  setPVGISData: vi.fn(),
  setSimulationResult: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()

  // Default store state
  vi.mocked(useAppStore).mockReturnValue({ ...DEFAULT_STORE, setPVGISData: vi.fn(), setSimulationResult: vi.fn() })

  // API defaults
  vi.mocked(fetchPVGISData).mockResolvedValue(makePVGIS())
  vi.mocked(fetchSpotPrices).mockResolvedValue([])
  vi.mocked(fetchCO2Emissions).mockResolvedValue(null)
  vi.mocked(fetchGridTariff).mockResolvedValue(null)
  vi.mocked(dsoFromPostcode).mockReturnValue(null)
  vi.mocked(runSimulation).mockReturnValue(MOCK_RESULT)

})

// Vitest auto-mock doesn't set named exports to values; set them manually
beforeEach(async () => {
  const pvgisMod = await import('@/lib/pvgis')
  ;(pvgisMod as unknown as Record<string, unknown>).DATA_YEAR = 2023

  const edsMod = await import('@/lib/energidataservice')
  ;(edsMod as unknown as Record<string, unknown>).VAT_MULTIPLIER = 1.25
  ;(edsMod as unknown as Record<string, unknown>).EUR_TO_DKK = 7.46

  const gtMod = await import('@/lib/gridtariff')
  ;(gtMod as unknown as Record<string, unknown>).ELAFGIFT_DKK = 0.9
  ;(gtMod as unknown as Record<string, unknown>).SYSTEM_TARIFF_DKK = 0.06

  const simMod = await import('@/lib/simulation')
  ;(simMod as unknown as Record<string, unknown>).HEATPUMP_ADDON_KWH = 6500
})

// --- Tests ---

describe('useSimulation — missing coordinates', () => {
  it('returns false immediately when coordinates are null', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      coordinates: null,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    const ok = await run()

    expect(ok).toBe(false)
    expect(fetchPVGISData).not.toHaveBeenCalled()
    expect(runSimulation).not.toHaveBeenCalled()
  })
})

describe('useSimulation — basic happy path', () => {
  it('returns true and stores result', async () => {
    const setSimulationResult = vi.fn()
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      setPVGISData: vi.fn(),
      setSimulationResult,
    })

    const { runSimulation: run } = useSimulation()
    const ok = await run()

    expect(ok).toBe(true)
    expect(setSimulationResult).toHaveBeenCalledWith(MOCK_RESULT)
  })

  it('fetches PVGIS with the configured solar system', async () => {
    const solarConfig = { peakKw: 10, tiltDeg: 30, azimuthDeg: 45, systemLossPct: 8 }
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      solarConfig,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    expect(fetchPVGISData).toHaveBeenCalledWith(
      DEFAULT_STORE.coordinates,
      solarConfig,
    )
  })

  it('passes heatpump addon when enabled', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      heatpumpEnabled: true,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    const addons = vi.mocked(runSimulation).mock.calls[0]?.[5]
    expect(addons?.heatpumpKwh).toBe(6500)
  })

  it('does not pass heatpump addon when disabled', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      heatpumpEnabled: false,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    const addons = vi.mocked(runSimulation).mock.calls[0]?.[5]
    expect(addons?.heatpumpKwh).toBeUndefined()
  })

  it('passes EV km/day when EV is enabled', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      evKmPerDay: 80,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    const addons = vi.mocked(runSimulation).mock.calls[0]?.[5]
    expect(addons?.evKmPerDay).toBe(80)
  })

  it('does not pass evKmPerDay when EV is disabled', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      evKmPerDay: null,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    const addons = vi.mocked(runSimulation).mock.calls[0]?.[5]
    expect(addons?.evKmPerDay).toBeUndefined()
  })
})

describe('useSimulation — fixed spot price', () => {
  it('skips fetchSpotPrices when fixedSpotDkk is set', async () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      fixedSpotDkk: 0.60,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    expect(fetchSpotPrices).not.toHaveBeenCalled()
  })

  it('builds a flat price array with the correct spotEur when fixedSpotDkk is set', async () => {
    const EUR_TO_DKK = 7.46
    const fixedSpotDkk = 0.60  // DKK/kWh
    const pvgis = makePVGIS(1000, 24)
    vi.mocked(fetchPVGISData).mockResolvedValue(pvgis)
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      fixedSpotDkk,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    const prices = vi.mocked(runSimulation).mock.calls[0]?.[2]
    expect(prices).toBeDefined()
    expect(prices!.length).toBe(24)

    // Each entry should have spotEur = (fixedSpotDkk / EUR_TO_DKK) * 1000
    const expectedSpotEur = (fixedSpotDkk / EUR_TO_DKK) * 1000
    prices!.forEach(p => {
      expect(p.spotEur).toBeCloseTo(expectedSpotEur, 4)
    })
  })

  it('uses hourly prices from fetchSpotPrices when fixedSpotDkk is null', async () => {
    const mockPrices = [{ hourStart: '2023-01-01T00:00:00Z', spotEur: 50, tariffDkk: 2.5 }]
    vi.mocked(fetchSpotPrices).mockResolvedValue(mockPrices)
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      fixedSpotDkk: null,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    expect(fetchSpotPrices).toHaveBeenCalled()
    const prices = vi.mocked(runSimulation).mock.calls[0]?.[2]
    expect(prices?.[0]?.spotEur).toBe(50)
  })
})

describe('useSimulation — gross consumption reconstruction', () => {
  it('reconstructs gross consumption from import + existing production - export', async () => {
    // 3 hours of data
    const importKwh  = [1.0, 2.0, 0.5]  // grid import per hour
    const exportKwh  = [0.0, 0.5, 0.0]  // grid export per hour
    // Existing system produces 500W = 0.5 kWh/h
    const existingWatts = 500
    const pvgisNew      = makePVGIS(1000, 3)
    const pvgisExisting = makePVGIS(existingWatts, 3)

    // fetchPVGISData called twice: first for new system, second for existing
    vi.mocked(fetchPVGISData)
      .mockResolvedValueOnce(pvgisNew)
      .mockResolvedValueOnce(pvgisExisting)

    const existingSolarConfig = { peakKw: 3, tiltDeg: 30, azimuthDeg: 0, systemLossPct: 5 }
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      existingSolarConfig,
      consumption: {
        source: 'eloverblik',
        annualKwh: 3.5,
        hourlyKwh: importKwh,
        exportKwh: exportKwh,
        hasExport: true,
      },
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    // gross = max(0, import + existingProduction - export)
    // existingProduction = 500W / 1000 = 0.5 kWh/h
    const expectedGross = [
      Math.max(0, 1.0 + 0.5 - 0.0),  // 1.5
      Math.max(0, 2.0 + 0.5 - 0.5),  // 2.0
      Math.max(0, 0.5 + 0.5 - 0.0),  // 1.0
    ]

    const effectiveConsumption = vi.mocked(runSimulation).mock.calls[0]?.[1]
    expect(effectiveConsumption?.hourlyKwh).toBeDefined()
    effectiveConsumption!.hourlyKwh!.forEach((v, i) => {
      expect(v).toBeCloseTo(expectedGross[i], 5)
    })
    expect(effectiveConsumption!.source).toBe('eloverblik')
  })

  it('skips reconstruction when there is no existing solar', async () => {
    const consumption = { source: 'eloverblik' as const, annualKwh: 5000, hourlyKwh: [1, 2, 3] }
    vi.mocked(useAppStore).mockReturnValue({
      ...DEFAULT_STORE,
      existingSolarConfig: null,
      consumption,
      setPVGISData: vi.fn(),
      setSimulationResult: vi.fn(),
    })

    const { runSimulation: run } = useSimulation()
    await run()

    // Only one fetchPVGISData call (no existing system fetch)
    expect(fetchPVGISData).toHaveBeenCalledTimes(1)
    const effectiveConsumption = vi.mocked(runSimulation).mock.calls[0]?.[1]
    expect(effectiveConsumption?.hourlyKwh).toEqual([1, 2, 3])
  })
})
