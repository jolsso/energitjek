// --- Solar system configuration ---
export type SegmentInputMode = 'capacity' | 'dimensions'

/**
 * One roof face / segment of a PV system (e.g. an east-facing and a
 * west-facing half of a split roof). PVGIS is queried per segment and the
 * hourly production arrays are summed — see fetchPVGISDataForSegments.
 */
export interface RoofSegment {
  id: string
  inputMode: SegmentInputMode
  tiltDeg: number         // Panel tilt angle (0 = flat, 90 = vertical)
  azimuthDeg: number      // Azimuth (0 = south, -90 = east, 90 = west)
  peakKw: number          // Installed peak capacity in kWp — used when inputMode === 'capacity'
  // Dimensions mode — capacity is derived, see getSegmentPeakKw()
  roofWidthM?: number
  roofHeightM?: number
  panelWattage?: number   // Wp per panel; defaults to DEFAULT_PANEL.wattage
  panelWidthM?: number
  panelHeightM?: number
}

export interface SolarConfig {
  systemLossPct: number   // Total system losses (%), typically 14
  segments: RoofSegment[] // 1–3 roof segments
}

// --- Address & location ---
export interface Coordinates {
  lat: number
  lon: number
}

// --- Consumption ---
export type ConsumptionSource = 'manual' | 'eloverblik'

/**
 * Hourly load-shape template used for manual consumption.
 * - standard:  typical Danish household (morning + evening peaks)
 * - heatpump:  heat pump dominated — more even load, morning/afternoon peaks
 * - ev:        EV home charging dominated — high consumption 22:00–06:00
 */
export type ConsumptionProfile = 'standard' | 'heatpump' | 'ev'

export interface ConsumptionData {
  source: ConsumptionSource
  annualKwh: number
  profile?: ConsumptionProfile
  // Hourly profile indexed by hour-of-year (0–8759), kWh per hour
  hourlyKwh?: number[]
  // Set when user has existing solar — hourly grid export kWh from Eloverblik
  exportKwh?: number[]
  hasExport?: boolean
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
  selfConsumedKwh: number   // production used directly + battery discharge to load
  gridExportKwh: number     // excess sent to grid (after battery charging)
  gridImportKwh: number     // consumption not covered by solar or battery
  savedDkk: number          // total savings this hour
  spotSavedDkk: number      // avoided spot cost (self-consumed × spot incl. VAT)
  tariffSavedDkk: number    // avoided tariffs/taxes (self-consumed × tariff)
  feedInDkk: number         // revenue from grid export
  // Battery fields (only present when battery is simulated)
  batteryChargeKwh?: number    // energy drawn from surplus into battery
  batteryDischargeKwh?: number // energy delivered from battery to load
  batteryStateKwh?: number     // state of charge at end of hour
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
