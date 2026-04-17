import { runSimulation } from './simulation'
import type { PVGISData, ConsumptionData, HourlyPrice } from '@/types'

/** Approximate roof area required per kWp (standard 400 W panels, ~2.4 m² each). */
export const M2_PER_KWP = 6

export interface SizeOption {
  peakKw: number
  annualSavedDkk: number
  paybackYears: number
}

/**
 * Sweep system sizes from 1 kWp to maxKwp in 0.5 kWp steps.
 * Production is scaled linearly from the reference PVGIS dataset.
 * Investment is scaled proportionally from the reference investment.
 */
export function sweepSystemSizes(
  pvgisData: PVGISData,
  referenceKwp: number,
  referenceInvestmentDkk: number,
  maxKwp: number,
  consumption: ConsumptionData,
  prices?: HourlyPrice[],
): SizeOption[] {
  const results: SizeOption[] = []
  const clamped = Math.min(maxKwp, 50)

  for (let i = 2; i <= clamped * 2; i++) {
    const kw = i * 0.5
    const scale = kw / referenceKwp
    const scaledPvgis: PVGISData = {
      ...pvgisData,
      annualKwh: pvgisData.annualKwh * scale,
      hourly: pvgisData.hourly.map(row => ({ ...row, P: row.P * scale })),
    }
    const { summary } = runSimulation(scaledPvgis, consumption, prices)
    if (summary.annualSavedDkk <= 0) continue

    const investment = (kw / referenceKwp) * referenceInvestmentDkk
    results.push({
      peakKw: kw,
      annualSavedDkk: summary.annualSavedDkk,
      paybackYears: investment / summary.annualSavedDkk,
    })
  }

  return results
}

/** Returns the option with the shortest payback period (best ROI). */
export function findOptimalSize(options: SizeOption[]): SizeOption | null {
  if (options.length === 0) return null
  return options.reduce((best, opt) => opt.paybackYears < best.paybackYears ? opt : best)
}
