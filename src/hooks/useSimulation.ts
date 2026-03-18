import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { fetchPVGISData, DATA_YEAR } from '@/lib/pvgis'
import { fetchSpotPrices, fetchCO2Emissions, VAT_MULTIPLIER } from '@/lib/energidataservice'
import { fetchGridTariff, dsoFromPostcode, ELAFGIFT_DKK, SYSTEM_TARIFF_DKK } from '@/lib/gridtariff'
import { runSimulation } from '@/lib/simulation'
import type { HourlyPrice } from '@/types'

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    coordinates,
    postcode,
    solarConfig,
    consumption,
    priceArea,
    batteryConfig,
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
      // Fetch PVGIS, spot prices, and grid tariff in parallel
      const dso = dsoFromPostcode(postcode)

      const [pvgis, rawPrices, tariff24, co2Factors] = await Promise.all([
        fetchPVGISData(coordinates, solarConfig),
        fetchSpotPrices(DATA_YEAR, priceArea).catch((err) => {
          console.warn('Spotpriser ikke tilgængelige — bruger faste priser.', err)
          return null
        }),
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
      if (rawPrices) {
        prices = rawPrices.map((p, i) => ({
          ...p,
          tariffDkk: tariff24
            ? // Hourly nettarif + elafgift + system tariff, all incl. VAT
              (tariff24[i % 24] + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
            : p.tariffDkk, // fallback: flat 1.40 from energidataservice.ts
        }))
      }

      const result = runSimulation(pvgis, consumption, prices, co2Factors ?? undefined, batteryConfig ?? undefined)
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
