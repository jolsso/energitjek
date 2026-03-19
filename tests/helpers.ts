/**
 * Shared Playwright test helpers — mock setup and common navigation flows.
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { makeNominatimResponse, makePVGISResponse } from './fixtures/pvgis'

export function makeSpotPricesResponse() {
  const records = Array.from({ length: 8760 }, (_, i) => ({
    HourDK: `2023-01-01T${String(i % 24).padStart(2, '0')}:00:00`,
    SpotPriceEUR: 80,
  }))
  return { records }
}

export function makeGridTariffResponse() {
  const prices = Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => {
      const val = i < 6 ? 0.0845 : (i >= 17 && i < 21) ? 0.7604 : 0.2535
      return [`Price${i + 1}`, val]
    }),
  )
  return {
    records: [{
      Note: 'Nettarif C',
      ResolutionDuration: 'PT1H',
      ValidFrom: '2024-01-01T00:00:00',
      ValidTo: null,
      ...prices,
    }],
  }
}

/** Mock all external API calls needed for a successful calculation. */
export async function mockExternalAPIs(
  page: Page,
  opts: { postcode?: string; lat?: string; lon?: string; displayName?: string } = {},
) {
  const { postcode = '8000', lat = '56.1572', lon = '10.2107',
    displayName = 'Rådhuspladsen 2, Aarhus C, Aarhus Kommune, 8000, Danmark' } = opts

  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeNominatimResponse(lat, lon, displayName, postcode)),
    }),
  )
  await page.route('**/api/pvgis/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makePVGISResponse(6)),
    }),
  )
  await page.route('**/api.energidataservice.dk/dataset/Elspot*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeSpotPricesResponse()),
    }),
  )
  await page.route('**/api.energidataservice.dk/dataset/DatahubPricelist*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeGridTariffResponse()),
    }),
  )
  await page.route('**/api.energidataservice.dk/dataset/CO2Emis*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ records: [] }),
    }),
  )
}

/** Geocode an address on the manual input page. */
export async function geocodeAddress(page: Page, address = 'Rådhuspladsen 2, Aarhus') {
  await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill(address)
  await page.getByRole('button', { name: 'Søg' }).click()
  await expect(page.getByText('Placering fundet')).toBeVisible()
}

/**
 * Navigate from the home page to the results page using the manual input mode.
 * Mocks all external APIs and performs a full calculation.
 */
export async function goToResults(
  page: Page,
  opts: { postcode?: string; lat?: string; lon?: string; displayName?: string } = {},
) {
  await page.goto('/')
  await mockExternalAPIs(page, opts)

  // Switch to manual mode
  await page.getByRole('button', { name: 'Manuel' }).click()

  await geocodeAddress(page)
  await page.getByRole('button', { name: 'Beregn besparelse' }).click()
  await expect(page.getByText('Estimeret besparelse')).toBeVisible()
}
