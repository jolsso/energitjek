import { test, expect } from '@playwright/test'
import { makeNominatimResponse } from './fixtures/pvgis'

test.describe('Address form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // AddressForm is only visible in manual input mode
    await page.getByRole('button', { name: 'Manuel' }).click()
  })

  test('shows matched display name after successful geocoding', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen 2, Aarhus')
    await page.getByRole('button', { name: 'Søg' }).click()

    await expect(page.getByText('Placering fundet')).toBeVisible()
    await expect(page.getByText('Rådhuspladsen 2, Aarhus C, Aarhus Kommune')).toBeVisible()
  })

  test('shows verification prompt asking user to confirm address', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen')
    await page.getByRole('button', { name: 'Søg' }).click()

    await expect(page.getByText('Er dette den rigtige adresse?')).toBeVisible()
  })

  test('shows error when address is not found', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('xyzxyzxyz')
    await page.getByRole('button', { name: 'Søg' }).click()

    await expect(page.getByText('Adressen kunne ikke findes')).toBeVisible()
  })

  test('clears result when address input changes after lookup', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen')
    await page.getByRole('button', { name: 'Søg' }).click()
    await expect(page.getByText('Placering fundet')).toBeVisible()

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen 2')
    await expect(page.getByText('Placering fundet')).not.toBeVisible()
  })

  test('submits on Enter key', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeNominatimResponse()),
      }),
    )

    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').fill('Rådhuspladsen')
    await page.getByPlaceholder('Søndergade 12, 8000 Aarhus').press('Enter')

    await expect(page.getByText('Placering fundet')).toBeVisible()
  })
})
