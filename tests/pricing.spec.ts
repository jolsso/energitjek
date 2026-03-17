import { test, expect } from '@playwright/test'
import { makeNominatimResponse } from './fixtures/pvgis'

test.describe('Priszone auto-detection', () => {
  test('sets DK1 and shows Elnet Midt after geocoding Aarhus (8000)', async ({ page }) => {
    await page.goto('/')
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse('56.1572', '10.2107',
          'Rådhuspladsen, Aarhus, Danmark', '8000')),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen, Aarhus')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible()

    // DK1 button should be selected (Jylland)
    await expect(page.getByRole('button', { name: /DK1/ })).toHaveClass(/bg-primary/)

    // DSO name should be shown
    await expect(page.getByText('Elnet Midt A/S')).toBeVisible()

    // Auto-detected badge should appear
    await expect(page.getByText('Auto-registreret')).toBeVisible()
  })

  test('sets DK2 and shows Radius after geocoding Copenhagen (2100)', async ({ page }) => {
    await page.goto('/')
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse('55.7128', '12.5618',
          'Østerbrogade, København Ø, Danmark', '2100')),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Østerbrogade, København')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible()

    // DK2 button should be selected (Sjælland)
    await expect(page.getByRole('button', { name: /DK2/ })).toHaveClass(/bg-primary/)

    // DSO name should be shown
    await expect(page.getByText('Radius Elnet A/S')).toBeVisible()
  })

  test('allows manual override of auto-detected price area', async ({ page }) => {
    await page.goto('/')
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse('56.1572', '10.2107',
          'Rådhuspladsen, Aarhus, Danmark', '8000')),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen, Aarhus')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible()

    // Auto-detected DK1 — manually switch to DK2
    await page.getByRole('button', { name: /DK2/ }).click()
    await expect(page.getByRole('button', { name: /DK2/ })).toHaveClass(/bg-primary/)
    await expect(page.getByRole('button', { name: /DK1/ })).not.toHaveClass(/bg-primary/)
  })
})
