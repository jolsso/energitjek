import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { fetchPVGISData, DATA_YEAR } from '@/lib/pvgis'
import { fetchSpotPrices } from '@/lib/energidataservice'
import { runSimulation } from '@/lib/simulation'
import type { HourlyPrice } from '@/types'

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    coordinates,
    solarConfig,
    consumption,
    priceArea,
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
      const pvgis = await fetchPVGISData(coordinates, solarConfig)
      setPVGISData(pvgis)

      let prices: HourlyPrice[] | undefined
      try {
        prices = await fetchSpotPrices(DATA_YEAR, priceArea)
      } catch (priceErr) {
        console.warn(
          'Kunne ikke hente spotpriser fra Energidataservice — bruger faste priser som fallback.',
          priceErr,
        )
        prices = undefined
      }

      const result = runSimulation(pvgis, consumption, prices)
      setSimulationResult(result)
      return true
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Noget gik galt. Prøv igen.',
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { runSimulation: run, isLoading, error }
}
