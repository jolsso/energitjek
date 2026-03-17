import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { fetchPVGISData } from '@/lib/pvgis'
import { runSimulation } from '@/lib/simulation'

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    coordinates,
    solarConfig,
    consumption,
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

      const result = runSimulation(pvgis, consumption)
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
