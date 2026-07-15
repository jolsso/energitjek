import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BatteryConfig,
  Coordinates,
  RoofSegment,
  SolarConfig,
  ConsumptionData,
  HourlyPrice,
  PVGISData,
  SimulationResult,
} from '@/types'
import type { PriceArea } from '@/lib/energidataservice'

export const MAX_SEGMENTS = 3

function makeSegment(overrides: Partial<RoofSegment> = {}): RoofSegment {
  return {
    id: crypto.randomUUID(),
    inputMode: 'capacity',
    peakKw: 3,
    tiltDeg: 35,
    azimuthDeg: 0,
    ...overrides,
  }
}

// Azimuth suggested for the next segment added — nudges toward the
// east/west split roof that motivated multi-segment support (issue #41).
function nextSegmentAzimuth(existingCount: number): number {
  return existingCount === 1 ? -90 : 90
}

function defaultSolarConfig(): SolarConfig {
  return { systemLossPct: 14, segments: [makeSegment({ peakKw: 6, azimuthDeg: 0 })] }
}

function defaultExistingSolarConfig(): SolarConfig {
  return { systemLossPct: 5, segments: [makeSegment({ peakKw: 6, azimuthDeg: 0 })] }
}

// --- Persisted-state migration (v1 flat SolarConfig -> v2 segments array) ---

interface LegacyFlatSolarConfig {
  peakKw: number
  tiltDeg: number
  azimuthDeg: number
  systemLossPct: number
}

function isLegacyFlatSolarConfig(cfg: unknown): cfg is LegacyFlatSolarConfig {
  return (
    typeof cfg === 'object' && cfg !== null &&
    'peakKw' in cfg && 'tiltDeg' in cfg && 'azimuthDeg' in cfg && 'systemLossPct' in cfg &&
    !('segments' in cfg)
  )
}

function migrateSolarConfig(cfg: unknown): unknown {
  if (isLegacyFlatSolarConfig(cfg)) {
    return {
      systemLossPct: cfg.systemLossPct,
      segments: [makeSegment({ peakKw: cfg.peakKw, tiltDeg: cfg.tiltDeg, azimuthDeg: cfg.azimuthDeg })],
    }
  }
  return cfg
}

interface AppState {
  // User inputs (persisted in localStorage)
  address: string
  postcode: string
  coordinates: Coordinates | null
  solarConfig: SolarConfig
  consumption: ConsumptionData
  priceArea: PriceArea
  investmentDkk: number
  fixedSpotDkk: number | null
  heatpumpEnabled: boolean
  evKmPerDay: number | null
  batteryConfig: BatteryConfig | null
  existingSolarConfig: SolarConfig | null
  dataYear: number
  theme: 'light' | 'dark' | 'system'

  // Fetched data (not persisted — refetched as needed)
  pvgisData: PVGISData | null
  simulationResult: SimulationResult | null
  hourlyPrices: HourlyPrice[] | null
  eloverblikDsoGln: string | null

  // Actions
  setAddress: (address: string) => void
  setPostcode: (postcode: string) => void
  setCoordinates: (coords: Coordinates | null) => void
  setSystemLossPct: (pct: number) => void
  addSolarSegment: () => void
  removeSolarSegment: (id: string) => void
  updateSolarSegment: (id: string, partial: Partial<RoofSegment>) => void
  setConsumption: (consumption: Partial<ConsumptionData> & { hourlyKwh?: number[] | undefined }) => void
  setPriceArea: (area: PriceArea) => void
  setInvestmentDkk: (dkk: number) => void
  setFixedSpotDkk: (dkk: number | null) => void
  setHeatpumpEnabled: (enabled: boolean) => void
  setEvKmPerDay: (km: number | null) => void
  setBatteryConfig: (config: BatteryConfig | null) => void
  setDataYear: (year: number) => void
  setExistingSolarConfig: (config: SolarConfig | null) => void
  setExistingSystemLossPct: (pct: number) => void
  addExistingSegment: () => void
  removeExistingSegment: (id: string) => void
  updateExistingSegment: (id: string, partial: Partial<RoofSegment>) => void
  setPVGISData: (data: PVGISData | null) => void
  setSimulationResult: (result: SimulationResult | null) => void
  setHourlyPrices: (prices: HourlyPrice[] | null) => void
  setEloverblikDsoGln: (gln: string | null) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  reset: () => void
}

const DEFAULT_CONSUMPTION: ConsumptionData = {
  source: 'manual',
  annualKwh: 5000,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      address: '',
      postcode: '',
      coordinates: null,
      solarConfig: defaultSolarConfig(),
      consumption: DEFAULT_CONSUMPTION,
      priceArea: 'DK2',
      investmentDkk: 60000,
      fixedSpotDkk: null,
      heatpumpEnabled: false,
      evKmPerDay: null,
      batteryConfig: null,
      existingSolarConfig: null,
      dataYear: 2023,
      theme: 'system',
      pvgisData: null,
      simulationResult: null,
      hourlyPrices: null,
      eloverblikDsoGln: null,

      setAddress: (address) => set({ address }),
      setPostcode: (postcode) => set({ postcode }),
      setCoordinates: (coordinates) => set({ coordinates }),

      setSystemLossPct: (systemLossPct) =>
        set((s) => ({ solarConfig: { ...s.solarConfig, systemLossPct } })),
      addSolarSegment: () =>
        set((s) => {
          if (s.solarConfig.segments.length >= MAX_SEGMENTS) return s
          const azimuthDeg = nextSegmentAzimuth(s.solarConfig.segments.length)
          return {
            solarConfig: {
              ...s.solarConfig,
              segments: [...s.solarConfig.segments, makeSegment({ azimuthDeg })],
            },
          }
        }),
      removeSolarSegment: (id) =>
        set((s) => ({
          solarConfig: {
            ...s.solarConfig,
            segments: s.solarConfig.segments.length > 1
              ? s.solarConfig.segments.filter((seg) => seg.id !== id)
              : s.solarConfig.segments,
          },
        })),
      updateSolarSegment: (id, partial) =>
        set((s) => ({
          solarConfig: {
            ...s.solarConfig,
            segments: s.solarConfig.segments.map((seg) => (seg.id === id ? { ...seg, ...partial } : seg)),
          },
        })),

      setConsumption: (consumption) =>
        set((s) => ({ consumption: { ...s.consumption, ...consumption } })),
      setPriceArea: (priceArea) => set({ priceArea }),
      setInvestmentDkk: (investmentDkk) => set({ investmentDkk }),
      setFixedSpotDkk: (fixedSpotDkk) => set({ fixedSpotDkk }),
      setHeatpumpEnabled: (heatpumpEnabled) => set({ heatpumpEnabled }),
      setEvKmPerDay: (evKmPerDay) => set({ evKmPerDay }),
      setBatteryConfig: (batteryConfig) => set({ batteryConfig }),
      setDataYear: (dataYear) => set({ dataYear }),

      setExistingSolarConfig: (existingSolarConfig) => set({ existingSolarConfig }),
      setExistingSystemLossPct: (systemLossPct) =>
        set((s) => (s.existingSolarConfig
          ? { existingSolarConfig: { ...s.existingSolarConfig, systemLossPct } }
          : s)),
      addExistingSegment: () =>
        set((s) => {
          if (!s.existingSolarConfig || s.existingSolarConfig.segments.length >= MAX_SEGMENTS) return s
          const azimuthDeg = nextSegmentAzimuth(s.existingSolarConfig.segments.length)
          return {
            existingSolarConfig: {
              ...s.existingSolarConfig,
              segments: [...s.existingSolarConfig.segments, makeSegment({ azimuthDeg })],
            },
          }
        }),
      removeExistingSegment: (id) =>
        set((s) => {
          if (!s.existingSolarConfig) return s
          return {
            existingSolarConfig: {
              ...s.existingSolarConfig,
              segments: s.existingSolarConfig.segments.length > 1
                ? s.existingSolarConfig.segments.filter((seg) => seg.id !== id)
                : s.existingSolarConfig.segments,
            },
          }
        }),
      updateExistingSegment: (id, partial) =>
        set((s) => {
          if (!s.existingSolarConfig) return s
          return {
            existingSolarConfig: {
              ...s.existingSolarConfig,
              segments: s.existingSolarConfig.segments.map((seg) => (seg.id === id ? { ...seg, ...partial } : seg)),
            },
          }
        }),

      setPVGISData: (pvgisData) => set({ pvgisData }),
      setSimulationResult: (simulationResult) => set({ simulationResult }),
      setHourlyPrices: (hourlyPrices) => set({ hourlyPrices }),
      setEloverblikDsoGln: (eloverblikDsoGln) => set({ eloverblikDsoGln }),
      setTheme: (theme) => set({ theme }),
      reset: () =>
        set({
          address: '',
          postcode: '',
          coordinates: null,
          solarConfig: defaultSolarConfig(),
          consumption: DEFAULT_CONSUMPTION,
          priceArea: 'DK2',
          investmentDkk: 60000,
          fixedSpotDkk: null,
          heatpumpEnabled: false,
          evKmPerDay: null,
          batteryConfig: null,
          existingSolarConfig: null,
          dataYear: 2023,
          pvgisData: null,
          simulationResult: null,
          hourlyPrices: null,
          eloverblikDsoGln: null,
        }),
    }),
    {
      name: 'energitjek-state',
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          const state = persisted as Record<string, unknown>
          if ('solarConfig' in state) state.solarConfig = migrateSolarConfig(state.solarConfig)
          if ('existingSolarConfig' in state) state.existingSolarConfig = migrateSolarConfig(state.existingSolarConfig)
          return state
        }
        return persisted
      },
      // Only persist user inputs, not computed results
      partialize: (s) => ({
        address: s.address,
        postcode: s.postcode,
        solarConfig: s.solarConfig,
        priceArea: s.priceArea,
        investmentDkk: s.investmentDkk,
        fixedSpotDkk: s.fixedSpotDkk,
        heatpumpEnabled: s.heatpumpEnabled,
        evKmPerDay: s.evKmPerDay,
        batteryConfig: s.batteryConfig,
        existingSolarConfig: s.existingSolarConfig,
        dataYear: s.dataYear,
        theme: s.theme,
        consumption: {
          source: s.consumption.source,
          annualKwh: s.consumption.annualKwh,
          profile: s.consumption.profile,
          // Do not persist hourly consumption data (potentially sensitive)
        },
      }),
    },
  ),
)

export { defaultExistingSolarConfig }
