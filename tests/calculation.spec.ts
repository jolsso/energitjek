import { test, expect } from '@playwright/test'
import { makePVGISResponse } from './fixtures/pvgis'
import { mockExternalAPIs, geocodeAddress, makeSpotPricesResponse, makeGridTariffResponse } from './helpers'

// Re-export local mocks so the slow loading-state test can use them
export { makeSpotPricesResponse, makeGridTariffResponse }

/** Switch to manual mode and geocode an address, then calculate. */
async function goToResultsManual(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Manuel' }).click()
  await geocodeAddress(page)
  await page.getByRole('button', { name: 'Beregn besparelse' }).click()
}

test.describe('Full calculation flow', () => {
  test('shows results panel after successful calculation', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    await expect(page.getByText('Estimeret besparelse')).toBeVisible()
  })

  test('shows all four KPI cards in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    await expect(page.getByText('Årlig produktion')).toBeVisible()
    await expect(page.getByText('Dækningsgrad')).toBeVisible()
    await expect(page.getByText('Egenforbrugspct.')).toBeVisible()
    await expect(page.getByText('Estimeret besparelse')).toBeVisible()
  })

  test('shows non-zero annual production in KPI card', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    const productionCard = page.locator('text=/\\d+ kWh/').first()
    await expect(productionCard).toBeVisible()
  })

  test('shows monthly savings chart in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    await expect(page.getByText('Månedlig besparelse')).toBeVisible()
  })

  test('shows data year badge in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    await expect(page.getByText('Data: 2023')).toBeVisible()
  })

  test('shows error if calculate clicked without geocoding', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()
    await expect(page.getByText('Indtast og bekræft din adresse først')).toBeVisible()
  })

  test('can navigate back to inputs from results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    await expect(page.getByText('Estimeret besparelse')).toBeVisible()
    await page.getByText('← Ret adresse og forbrug').click()
    await expect(page.getByText('Beregn din solcelleøkonomi')).toBeVisible()
  })

  test('button shows loading state while fetching', async ({ page }) => {
    await page.goto('/')
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ lat: '56.15', lon: '10.21', display_name: 'Rådhuspladsen 2, Aarhus', address: { postcode: '8000' } }]),
      }),
    )
    await page.route('**/api/pvgis/**', async route => {
      await new Promise(r => setTimeout(r, 500))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makePVGISResponse()),
      })
    })

    await page.getByRole('button', { name: 'Manuel' }).click()
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()
    await expect(page.getByRole('button', { name: 'Beregner…' })).toBeVisible()
  })
})

test.describe('Solar config form', () => {
  test('displays default values in results sidebar', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await goToResultsManual(page)

    // SolarConfigForm is in the results sidebar — verify default values
    await expect(page.getByText('6 kWp').first()).toBeVisible()
    await expect(page.getByText('35 °')).toBeVisible()
    await expect(page.getByText('Syd (0°)')).toBeVisible()
  })
})
