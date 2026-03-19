import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { fetchPVGISData, DATA_YEAR } from '@/lib/pvgis'
import { fetchSpotPrices, fetchCO2Emissions, VAT_MULTIPLIER, EUR_TO_DKK } from '@/lib/energidataservice'
import { fetchGridTariff, dsoFromPostcode, ELAFGIFT_DKK, SYSTEM_TARIFF_DKK } from '@/lib/gridtariff'
import { runSimulation } from '@/lib/simulation'
import type { ConsumptionData, HourlyPrice } from '@/types'

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    coordinates,
    postcode,
    solarConfig,
    consumption,
    priceArea,
    fixedSpotDkk,
    batteryConfig,
    existingSolarConfig,
    setPVGISData,
    setSimulationResult,
  } = useAppStore()

  const run = async (): Promise<boolean> => {
    if (!coordinates) {
      setError('Indtast og bekræft din adresse først.')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const dso = dsoFromPostcode(postcode)

      const [pvgis, pvgisExisting, rawPrices, tariff24, co2Factors] = await Promise.all([
        fetchPVGISData(coordinates, solarConfig),
        // Fetch existing system PVGIS in parallel when user has solar already installed
        existingSolarConfig && consumption.hasExport
          ? fetchPVGISData(coordinates, existingSolarConfig)
          : Promise.resolve(null),
        // Skip spot price fetch when user has set a fixed spot price
        fixedSpotDkk === null
          ? fetchSpotPrices(DATA_YEAR, priceArea).catch((err) => {
              console.warn('Spotpriser ikke tilgængelige — bruger faste priser.', err)
              return null
            })
          : Promise.resolve(null),
        dso
          ? fetchGridTariff(dso.glnNumber).catch((err) => {
              console.warn(`Nettarif ikke tilgængelig for ${dso.name} — bruger fast tarif.`, err)
              return null
            })
          : Promise.resolve(null),
        fetchCO2Emissions(DATA_YEAR, priceArea).catch((err) => {
          console.warn('CO2-emissionsdata ikke tilgængelig — bruger fast faktor.', err)
          return null
        }),
      ])

      setPVGISData(pvgis)

      let prices: HourlyPrice[] | undefined
      if (fixedSpotDkk !== null) {
        // Build flat hourly prices using the user-specified spot price
        const spotEur = (fixedSpotDkk / EUR_TO_DKK) * 1000  // DKK/kWh → EUR/MWh
        prices = Array.from({ length: pvgis.hourly.length }, (_, i) => ({
          hourStart: pvgis.hourly[i].time,
          spotEur,
          tariffDkk: tariff24
            ? (tariff24[i % 24] + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
            : (ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER,
        }))
      } else if (rawPrices) {
        prices = rawPrices.map((p, i) => ({
          ...p,
          tariffDkk: tariff24
            ? (tariff24[i % 24] + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
            : p.tariffDkk,
        }))
      }

      // Reconstruct gross consumption when the user has existing solar installed.
      // Eloverblik import/export already reflects the existing system, so we need to
      // add back the existing production and subtract the exported surplus:
      //   gross[h] = import[h] + pvgisExisting[h] - export[h]
      let effectiveConsumption: ConsumptionData = consumption
      if (
        existingSolarConfig &&
        consumption.hasExport &&
        consumption.hourlyKwh &&
        consumption.exportKwh &&
        pvgisExisting
      ) {
        const importKwh = consumption.hourlyKwh
        const exportKwh = consumption.exportKwh
        const existingHourly = pvgisExisting.hourly.map((e) => e.P / 1000)  // W → kWh

        const grossHourly = importKwh.map((imp, i) =>
          Math.max(0, imp + (existingHourly[i] ?? 0) - (exportKwh[i] ?? 0)),
        )
        const grossAnnual = grossHourly.reduce((s, v) => s + v, 0)

        effectiveConsumption = {
          source: 'eloverblik',
          annualKwh: grossAnnual,
          hourlyKwh: grossHourly,
        }
      }

      const result = runSimulation(pvgis, effectiveConsumption, prices, co2Factors ?? undefined, batteryConfig ?? undefined)
      setSimulationResult(result)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noget gik galt. Prøv igen.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { runSimulation: run, isLoading, error }
}
