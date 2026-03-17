import type {
  ConsumptionData,
  HourlyPrice,
  HourlySimulation,
  PVGISData,
  SimulationResult,
  SimulationSummary,
} from '@/types'
import { EUR_TO_DKK } from './energidataservice'
import { pvgisTimeToISO } from './pvgis'

/**
 * Flat electricity retail price in DKK/kWh used when spot price data is
 * unavailable. Includes distribution, taxes, and VAT (rough Danish average).
 */
const FLAT_RETAIL_PRICE_DKK = 3.0

/**
 * Feed-in tariff for grid export in DKK/kWh.
 * Denmark does not offer a full net-metering scheme — surplus production is
 * sold at spot price minus grid fees, typically much lower than retail.
 */
const FEED_IN_TARIFF_DKK = 0.10

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

  // Build hourly price profile (DKK/kWh retail)
  const priceProfile = buildPriceProfile(prices, n)

  const hourly: HourlySimulation[] = pvgis.hourly.map((row, i) => {
    const productionKwh = row.P / 1000  // W → kWh (hourly average)
    const consumptionKwh = consumptionProfile[i]
    const retailPrice = priceProfile[i]

    const selfConsumedKwh = Math.min(productionKwh, consumptionKwh)
    const gridExportKwh = Math.max(0, productionKwh - consumptionKwh)
    const gridImportKwh = Math.max(0, consumptionKwh - productionKwh)

    // Savings = avoided import cost + feed-in revenue
    const savedDkk =
      selfConsumedKwh * retailPrice + gridExportKwh * FEED_IN_TARIFF_DKK

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

function buildConsumptionProfile(data: ConsumptionData, n: number): number[] {
  if (data.hourlyKwh && data.hourlyKwh.length === n) {
    return data.hourlyKwh
  }
  // Flat profile: distribute annual kWh evenly across all hours
  const hourlyKwh = data.annualKwh / n
  return Array(n).fill(hourlyKwh)
}

function buildPriceProfile(prices: HourlyPrice[] | undefined, n: number): number[] {
  if (!prices || prices.length === 0) {
    return Array(n).fill(FLAT_RETAIL_PRICE_DKK)
  }
  return prices.slice(0, n).map(p => {
    const spotDkk = (p.spotEur / 1000) * EUR_TO_DKK  // EUR/MWh → DKK/kWh
    return spotDkk + p.tariffDkk
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

  return {
    annualProductionKwh,
    annualConsumptionKwh,
    selfConsumptionPct,
    coveragePct,
    annualSavedDkk,
    paybackYears: null,  // set externally when investment cost is provided
  }
}

