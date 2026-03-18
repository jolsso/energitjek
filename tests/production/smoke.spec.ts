import { test, expect } from '@playwright/test'

/**
 * Smoke tests against the live Vercel deployment (https://energitjek.vercel.app).
 * These tests call real external APIs to validate the full proxy stack works end-to-end.
 */

test.describe('Page load', () => {
  test('front page renders with headline and form', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Beregn din')).toBeVisible()
    await expect(page.getByPlaceholder('Søndergade 12, 8000 Aarhus')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Beregn besparelse' })).toBeVisible()
  })

  test('SPA routing — direct navigation to / works', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('https://energitjek.vercel.app/')
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Address geocoding (Nominatim)', () => {
  test('geocodes a real Danish address', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen 2, 8000 Aarhus')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('PVGIS proxy (/api/pvgis)', () => {
  test('full calculation flow succeeds with real PVGIS data', async ({ page }) => {
    await page.goto('/')

    // Geocode
    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen 2, 8000 Aarhus')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible({ timeout: 15_000 })

    // Run simulation — this calls PVGIS and Energidataservice through Vercel serverless
    await page.getByRole('button', { name: 'Beregn besparelse' }).click()
    await expect(page.getByText('Dine resultater')).toBeVisible({ timeout: 30_000 })

    // Verify key result cards are populated
    await expect(page.getByText('Årlig produktion')).toBeVisible()
    await expect(page.getByText('Estimeret besparelse')).toBeVisible()
    await expect(page.getByText('kWh')).toBeVisible()
  })
})

test.describe('Static assets', () => {
  test('loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})
