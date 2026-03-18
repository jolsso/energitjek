// --- Solar system configuration ---
export interface SolarConfig {
  peakKw: number         // Installed peak capacity in kWp
  tiltDeg: number        // Panel tilt angle (0 = flat, 90 = vertical)
  azimuthDeg: number     // Azimuth (0 = south, -90 = east, 90 = west)
  systemLossPct: number  // Total system losses (%), typically 14
}

// --- Address & location ---
export interface Coordinates {
  lat: number
  lon: number
}

// --- Consumption ---
export type ConsumptionSource = 'manual' | 'eloverblik'

export interface ConsumptionData {
  source: ConsumptionSource
  annualKwh: number
  // Hourly profile indexed by hour-of-year (0–8759), kWh per hour
  hourlyKwh?: number[]
}

// --- PVGIS response ---
export interface PVGISHourlyEntry {
  time: string   // "20XX:MMDD:HH:MM"
  P: number      // PV power output (W)
  G_i: number    // Global irradiance (W/m²)
  T2m: number    // Air temperature (°C)
}

export interface PVGISData {
  hourly: PVGISHourlyEntry[]
  annualKwh: number
  location: Coordinates
}

// --- Pricing ---
export interface HourlyPrice {
  hourStart: string  // ISO datetime
  spotEur: number    // Spot price EUR/MWh
  tariffDkk: number  // Fixed tariff DKK/kWh
}

// --- Simulation result ---
export interface HourlySimulation {
  hourStart: string
  consumptionKwh: number
  productionKwh: number
  selfConsumedKwh: number   // production used directly
  gridExportKwh: number     // excess sent to grid
  gridImportKwh: number     // consumption not covered by solar
  savedDkk: number          // total savings this hour
  spotSavedDkk: number      // avoided spot cost (self-consumed × spot incl. VAT)
  tariffSavedDkk: number    // avoided tariffs/taxes (self-consumed × tariff)
  feedInDkk: number         // revenue from grid export
}

export interface SimulationResult {
  hourly: HourlySimulation[]
  summary: SimulationSummary
}

export interface SimulationSummary {
  annualProductionKwh: number
  annualConsumptionKwh: number
  selfConsumptionPct: number   // % of production self-consumed
  coveragePct: number          // % of consumption covered by solar
  annualSavedDkk: number
  co2SavedKg: number           // kg CO2 avoided annually (self-consumed kWh × grid factor)
  paybackYears: number | null  // null if investment cost not provided
}

// --- Battery (Phase 4) ---
export interface BatteryConfig {
  capacityKwh: number
  maxChargeKw: number
  maxDischargeKw: number
  roundTripEfficiencyPct: number
  strategy: 'self-consumption' | 'peak-shaving' | 'time-of-use'
}
