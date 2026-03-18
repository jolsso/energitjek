import type {
  ConsumptionData,
  HourlyPrice,
  HourlySimulation,
  PVGISData,
  SimulationResult,
  SimulationSummary,
} from '@/types'
import { EUR_TO_DKK, VAT_MULTIPLIER, FEED_IN_MULTIPLIER } from './energidataservice'
import { pvgisTimeToISO } from './pvgis'

/**
 * Flat electricity retail price in DKK/kWh used when spot price data is
 * unavailable. Includes distribution, taxes, and VAT (rough Danish average).
 */
const FLAT_RETAIL_PRICE_DKK = 3.0

/**
 * Danish grid average CO2 emission factor (kg CO2 per kWh consumed from grid).
 * Source: Energinet annual average for 2023 (~130 g/kWh).
 * Applied only to self-consumed solar production (avoided grid draw).
 */
const CO2_GRID_FACTOR_KG_PER_KWH = 0.130

/**
 * Flat feed-in price used as fallback when no spot prices are provided.
 * Denmark does not offer a full net-metering scheme — surplus production is
 * sold at spot price minus grid fees, typically much lower than retail.
 */
const FLAT_FEED_IN_PRICE_DKK = 0.10

/**
 * Core simulation: joins hourly production, consumption, and optional prices
 * to compute self-consumption, grid flows, and savings.
 */
export function runSimulation(
  pvgis: PVGISData,
  consumption: ConsumptionData,
  prices?: HourlyPrice[],
): SimulationResult {
  const n = pvgis.hourly.length  // 8760 or 8784

  // Build hourly consumption profile (kWh)
  const consumptionProfile = buildConsumptionProfile(consumption, n)

  // Build hourly price profile (DKK/kWh retail and feed-in)
  const priceProfile = buildPriceProfile(prices, n)

  const hourly: HourlySimulation[] = pvgis.hourly.map((row, i) => {
    const productionKwh = row.P / 1000  // W → kWh (hourly average)
    const consumptionKwh = consumptionProfile[i]
    const { retail: retailPrice, feedIn: feedInPrice } = priceProfile[i]

    const selfConsumedKwh = Math.min(productionKwh, consumptionKwh)
    const gridExportKwh = Math.max(0, productionKwh - consumptionKwh)
    const gridImportKwh = Math.max(0, consumptionKwh - productionKwh)

    // Savings = avoided import cost + feed-in revenue
    const savedDkk =
      selfConsumedKwh * retailPrice + gridExportKwh * feedInPrice

    return {
      hourStart: pvgisTimeToISO(row.time),
      consumptionKwh,
      productionKwh,
      selfConsumedKwh,
      gridExportKwh,
      gridImportKwh,
      savedDkk,
    }
  })

  const summary = computeSummary(hourly, consumption.annualKwh)
  return { hourly, summary }
}

/**
 * Relative consumption weights by hour of day (0–23).
 * Represents a typical Danish single-family household:
 * low at night, morning and evening peaks, lower midday.
 * Un-normalized — buildConsumptionProfile scales to annualKwh.
 */
const HOURLY_SHAPE: readonly number[] = [
  0.28, 0.23, 0.20, 0.19, 0.19, 0.27,  // 00–05  night
  0.55, 0.95, 0.85, 0.72, 0.65, 0.65,  // 06–11  morning
  0.70, 0.65, 0.62, 0.68, 0.90, 1.25,  // 12–17  midday / ramp-up
  1.45, 1.55, 1.45, 1.25, 0.92, 0.56,  // 18–23  evening / wind-down
]

/**
 * Day-of-week multiplier indexed from Sunday (0) to Saturday (6).
 * Jan 1 2023 (simulation start) is a Sunday, so index 0 = hour 0.
 * Weekends have higher daytime use; weekdays slightly lower (people at work).
 */
const DAY_WEIGHTS: readonly number[] = [1.08, 0.95, 0.95, 0.97, 0.97, 1.02, 1.12]

function buildConsumptionProfile(data: ConsumptionData, n: number): number[] {
  if (data.hourlyKwh && data.hourlyKwh.length === n) {
    return data.hourlyKwh
  }
  // Weekly shape: combine hour-of-day profile with day-of-week weight,
  // then normalize so the total equals annualKwh.
  const weights = Array.from({ length: n }, (_, i) =>
    HOURLY_SHAPE[i % 24] * DAY_WEIGHTS[Math.floor(i / 24) % 7]
  )
  const scale = data.annualKwh / weights.reduce((s, w) => s + w, 0)
  return weights.map(w => w * scale)
}

interface HourlyPrices {
  retail: number
  feedIn: number
}

function buildPriceProfile(prices: HourlyPrice[] | undefined, n: number): HourlyPrices[] {
  if (!prices || prices.length === 0) {
    return Array(n).fill({ retail: FLAT_RETAIL_PRICE_DKK, feedIn: FLAT_FEED_IN_PRICE_DKK })
  }
  return prices.slice(0, n).map(p => {
    const spotDkk = (p.spotEur / 1000) * EUR_TO_DKK  // EUR/MWh → DKK/kWh
    // Retail: spot (incl. VAT) + fixed tariffs
    const retail = spotDkk * VAT_MULTIPLIER + p.tariffDkk
    // Feed-in: 90% of spot price, no VAT or taxes on exports
    const feedIn = spotDkk * FEED_IN_MULTIPLIER
    return { retail, feedIn }
  })
}

function computeSummary(hourly: HourlySimulation[], annualConsumptionKwh: number): SimulationSummary {
  const annualProductionKwh = hourly.reduce((s, h) => s + h.productionKwh, 0)
  const totalSelfConsumed = hourly.reduce((s, h) => s + h.selfConsumedKwh, 0)
  const annualSavedDkk = hourly.reduce((s, h) => s + h.savedDkk, 0)

  const selfConsumptionPct = annualProductionKwh > 0
    ? (totalSelfConsumed / annualProductionKwh) * 100
    : 0

  const coveragePct = annualConsumptionKwh > 0
    ? (totalSelfConsumed / annualConsumptionKwh) * 100
    : 0

  const co2SavedKg = totalSelfConsumed * CO2_GRID_FACTOR_KG_PER_KWH

  return {
    annualProductionKwh,
    annualConsumptionKwh,
    selfConsumptionPct,
    coveragePct,
    annualSavedDkk,
    co2SavedKg,
    paybackYears: null,  // set externally when investment cost is provided
  }
}

