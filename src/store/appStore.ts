import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Coordinates,
  SolarConfig,
  ConsumptionData,
  PVGISData,
  SimulationResult,
} from '@/types'
import type { PriceArea } from '@/lib/energidataservice'

interface AppState {
  // User inputs (persisted in localStorage)
  address: string
  postcode: string
  coordinates: Coordinates | null
  solarConfig: SolarConfig
  consumption: ConsumptionData
  priceArea: PriceArea
  investmentDkk: number

  // Fetched data (not persisted — refetched as needed)
  pvgisData: PVGISData | null
  simulationResult: SimulationResult | null

  // Actions
  setAddress: (address: string) => void
  setPostcode: (postcode: string) => void
  setCoordinates: (coords: Coordinates | null) => void
  setSolarConfig: (config: Partial<SolarConfig>) => void
  setConsumption: (consumption: Partial<ConsumptionData> & { hourlyKwh?: number[] | undefined }) => void
  setPriceArea: (area: PriceArea) => void
  setInvestmentDkk: (dkk: number) => void
  setPVGISData: (data: PVGISData | null) => void
  setSimulationResult: (result: SimulationResult | null) => void
  reset: () => void
}

const DEFAULT_SOLAR_CONFIG: SolarConfig = {
  peakKw: 6,
  tiltDeg: 35,
  azimuthDeg: 0,   // south-facing
  systemLossPct: 14,
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
      solarConfig: DEFAULT_SOLAR_CONFIG,
      consumption: DEFAULT_CONSUMPTION,
      priceArea: 'DK2',
      investmentDkk: 0,
      pvgisData: null,
      simulationResult: null,

      setAddress: (address) => set({ address }),
      setPostcode: (postcode) => set({ postcode }),
      setCoordinates: (coordinates) => set({ coordinates }),
      setSolarConfig: (config) =>
        set((s) => ({ solarConfig: { ...s.solarConfig, ...config } })),
      setConsumption: (consumption) =>
        set((s) => ({ consumption: { ...s.consumption, ...consumption } })),
      setPriceArea: (priceArea) => set({ priceArea }),
      setInvestmentDkk: (investmentDkk) => set({ investmentDkk }),
      setPVGISData: (pvgisData) => set({ pvgisData }),
      setSimulationResult: (simulationResult) => set({ simulationResult }),
      reset: () =>
        set({
          address: '',
          postcode: '',
          coordinates: null,
          solarConfig: DEFAULT_SOLAR_CONFIG,
          consumption: DEFAULT_CONSUMPTION,
          priceArea: 'DK2',
          investmentDkk: 0,
          pvgisData: null,
          simulationResult: null,
        }),
    }),
    {
      name: 'energitjek-state',
      // Only persist user inputs, not computed results
      partialize: (s) => ({
        address: s.address,
        postcode: s.postcode,
        solarConfig: s.solarConfig,
        priceArea: s.priceArea,
        investmentDkk: s.investmentDkk,
        consumption: {
          source: s.consumption.source,
          annualKwh: s.consumption.annualKwh,
          // Do not persist hourly consumption data (potentially sensitive)
        },
      }),
    },
  ),
)
