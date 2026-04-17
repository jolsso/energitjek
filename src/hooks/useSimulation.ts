import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { fetchPVGISData, pvgisTimeToCopenhagenHour } from '@/lib/pvgis'
import { fetchSpotPrices, fetchCO2Emissions, VAT_MULTIPLIER, EUR_TO_DKK } from '@/lib/energidataservice'
import { fetchGridTariff, dsoFromPostcode, ELAFGIFT_DKK, SYSTEM_TARIFF_DKK, FALLBACK_NETTARIF_DKK } from '@/lib/gridtariff'
import { runSimulation, HEATPUMP_ADDON_KWH } from '@/lib/simulation'
import type { ConsumptionData, HourlyPrice } from '@/types'

export function useSimulation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    coordinates,
    postcode,
    eloverblikDsoGln,
    solarConfig,
    consumption,
    priceArea,
    fixedSpotDkk,
    heatpumpEnabled,
    evKmPerDay,
    batteryConfig,
    existingSolarConfig,
    dataYear,
    setPVGISData,
    setSimulationResult,
    setHourlyPrices,
  } = useAppStore()

  const run = async (): Promise<boolean> => {
    if (!coordinates) {
      setError('Indtast og bekræft din adresse først.')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const dso = eloverblikDsoGln
        ? { glnNumber: eloverblikDsoGln, name: 'Netselskab (fra Eloverblik)' }
        : dsoFromPostcode(postcode)

      const [pvgis, pvgisExisting, rawPrices, tariff24, co2Factors] = await Promise.all([
        fetchPVGISData(coordinates, solarConfig, dataYear),
        // Fetch existing system PVGIS in parallel when user has solar already installed
        existingSolarConfig && consumption.hasExport
          ? fetchPVGISData(coordinates, existingSolarConfig, dataYear)
          : Promise.resolve(null),
        // Skip spot price fetch when user has set a fixed spot price
        fixedSpotDkk === null
          ? fetchSpotPrices(dataYear, priceArea).catch((err) => {
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
        fetchCO2Emissions(dataYear, priceArea).catch((err) => {
          console.warn('CO2-emissionsdata ikke tilgængelig — bruger fast faktor.', err)
          return null
        }),
      ])

      setPVGISData(pvgis)
      setHourlyPrices(null)  // reset until prices are built below

      let prices: HourlyPrice[] | undefined
      if (fixedSpotDkk !== null) {
        // Build flat hourly prices using the user-specified spot price.
        // Use Copenhagen local time for each PVGIS hour so tariff24 (indexed
        // by hour-of-day in local time) is looked up correctly.
        const spotEur = (fixedSpotDkk / EUR_TO_DKK) * 1000  // DKK/kWh → EUR/MWh
        const fallbackTariff = (FALLBACK_NETTARIF_DKK + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
        prices = pvgis.hourly.map((row) => {
          const cphHour = pvgisTimeToCopenhagenHour(row.time)
          const hourOfDay = parseInt(cphHour.slice(11, 13), 10)
          return {
            hourStart: cphHour,
            spotEur,
            tariffDkk: tariff24
              ? (tariff24[hourOfDay] + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
              : fallbackTariff,
          }
        })
      } else if (rawPrices) {
        // Join PVGIS production (UTC) with EDS spot prices (HourDK = CET/CEST)
        // by converting each PVGIS UTC timestamp to Copenhagen local time and
        // looking up the matching price row. Aligning by array index would cause
        // a systematic 1–2 hour offset due to timezone differences.
        const priceByHour = new Map(rawPrices.map(p => [p.hourStart.slice(0, 13), p]))
        prices = pvgis.hourly.map((row) => {
          const cphHour = pvgisTimeToCopenhagenHour(row.time)
          const hourOfDay = parseInt(cphHour.slice(11, 13), 10)
          const base = priceByHour.get(cphHour)
          return {
            hourStart: cphHour,
            spotEur: base?.spotEur ?? 0,
            tariffDkk: tariff24
              ? (tariff24[hourOfDay] + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER
              : (base?.tariffDkk ?? (FALLBACK_NETTARIF_DKK + ELAFGIFT_DKK + SYSTEM_TARIFF_DKK) * VAT_MULTIPLIER),
          }
        })
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

      setHourlyPrices(prices ?? null)

      const result = runSimulation(
        pvgis,
        effectiveConsumption,
        prices,
        co2Factors ?? undefined,
        batteryConfig ?? undefined,
        {
          heatpumpKwh: heatpumpEnabled ? HEATPUMP_ADDON_KWH : undefined,
          evKmPerDay:  evKmPerDay ?? undefined,
        },
      )
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
