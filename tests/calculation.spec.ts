import { test, expect } from '@playwright/test'
import { makeNominatimResponse, makePVGISResponse } from './fixtures/pvgis'

function makeSpotPricesResponse() {
  // 8760 hourly records for 2023
  const records = Array.from({ length: 8760 }, (_, i) => ({
    HourDK: `2023-01-01T${String(i % 24).padStart(2, '0')}:00:00`,
    SpotPriceEUR: 80,
  }))
  return { records }
}

function makeGridTariffResponse() {
  // 24-value Nettarif C (3-tier: low off-peak, mid shoulder, high peak)
  const prices = Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => {
      const h = i + 1  // Price1..Price24
      const val = i < 6 ? 0.0845 : (i >= 17 && i < 21) ? 0.7604 : 0.2535
      return [`Price${h}`, val]
    })
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

async function mockExternalAPIs(page: import('@playwright/test').Page) {
  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeNominatimResponse()),
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
}

async function geocodeAddress(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen 2, Aarhus')
  await page.getByRole('button', { name: 'Søg' }).click()
  await expect(page.getByText('Placering fundet')).toBeVisible()
}

test.describe('Full calculation flow', () => {
  test('shows results panel after successful calculation', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await geocodeAddress(page)

    await page.getByRole('button', { name: 'Beregn besparelse' }).click()

    await expect(page.getByText('Dine resultater')).toBeVisible()
    await expect(page.getByText('Månedlig oversigt')).toBeVisible()
  })

  test('shows all four KPI cards in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()

    await expect(page.getByText('Årlig produktion')).toBeVisible()
    await expect(page.getByText('Dækningsgrad')).toBeVisible()
    await expect(page.getByText('Egenforbrugspct.')).toBeVisible()
    await expect(page.getByText('Estimeret besparelse')).toBeVisible()
  })

  test('shows non-zero annual production in KPI card', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()

    await expect(page.getByText('Dine resultater')).toBeVisible()

    const productionCard = page.locator('text=/\\d+ kWh/').first()
    await expect(productionCard).toBeVisible()
  })

  test('shows monthly savings chart in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()

    await expect(page.getByText('Månedlig besparelse')).toBeVisible()
  })

  test('shows data year badge in results', async ({ page }) => {
    await page.goto('/')
    await mockExternalAPIs(page)
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()

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
    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()
    await expect(page.getByText('Dine resultater')).toBeVisible()

    await page.getByText('← Ret indstillinger').click()
    await expect(page.getByText('Beregn din solcelleøkonomi')).toBeVisible()
  })

  test('button shows loading state while fetching', async ({ page }) => {
    await page.goto('/')

    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
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

    await geocodeAddress(page)
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()
    await expect(page.getByRole('button', { name: 'Beregner…' })).toBeVisible()
  })
})

test.describe('Solar config form', () => {
  test('displays default values', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('6 kWp').first()).toBeVisible()
    await expect(page.getByText('35 °')).toBeVisible()
    await expect(page.getByText('Syd (0°)')).toBeVisible()
  })
})
