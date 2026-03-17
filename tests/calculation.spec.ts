import { test, expect } from '@playwright/test'
import { makeNominatimResponse, makePVGISResponse } from './fixtures/pvgis'

async function mockExternalAPIs(page: import('@playwright/test').Page) {
  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeNominatimResponse()),
    }),
  )
  await page.route('**/re.jrc.ec.europa.eu/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makePVGISResponse(6)),
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

    // Wait for results panel
    await expect(page.getByText('Dine resultater')).toBeVisible()

    // Production value should be a non-zero kWh figure
    const productionCard = page.locator('text=/\\d+ kWh/').first()
    await expect(productionCard).toBeVisible()
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

    // Delay PVGIS response to observe loading state
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
      }),
    )
    await page.route('**/re.jrc.ec.europa.eu/**', async route => {
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
    await expect(page.getByText('6 kWp')).toBeVisible()
    await expect(page.getByText('35 °')).toBeVisible()
    await expect(page.getByText('Syd (0°)')).toBeVisible()
  })
})
