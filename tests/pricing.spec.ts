import { test, expect } from '@playwright/test'
import { goToResults } from './helpers'

test.describe('Netselskab auto-detektion', () => {
  test('shows Elnet Midt in sidebar after calculating for Aarhus (8000)', async ({ page }) => {
    await goToResults(page, {
      postcode: '8000',
      lat: '56.1572',
      lon: '10.2107',
      displayName: 'Rådhuspladsen, Aarhus, 8000, Danmark',
    })

    await expect(page.getByText('Elnet Midt A/S')).toBeVisible()
    await expect(page.getByText('Auto-registreret')).toBeVisible()
  })

  test('shows Radius in sidebar after calculating for Copenhagen (2100)', async ({ page }) => {
    await goToResults(page, {
      postcode: '2100',
      lat: '55.7128',
      lon: '12.5618',
      displayName: 'Østerbrogade, København Ø, 2100, Danmark',
    })

    await expect(page.getByText('Radius Elnet A/S')).toBeVisible()
    await expect(page.getByText('Auto-registreret')).toBeVisible()
  })

  test('shows hourly tariff note when DSO is detected', async ({ page }) => {
    await goToResults(page, {
      postcode: '8000',
      lat: '56.1572',
      lon: '10.2107',
      displayName: 'Rådhuspladsen, Aarhus, 8000, Danmark',
    })

    await expect(page.getByText('Timebaseret nettarif hentes automatisk til simuleringen.')).toBeVisible()
  })
})

test.describe('Fast spotpris', () => {
  test('fixed spot price toggle is visible in sidebar', async ({ page }) => {
    await goToResults(page)

    await expect(page.getByText('Fast spotpris')).toBeVisible()
    await expect(page.getByText('Tilsidesæt timebaserede spotpriser')).toBeVisible()
  })

  test('enabling fixed spot price shows the øre/kWh slider', async ({ page }) => {
    await goToResults(page)

    // The price slider label should not be visible yet
    await expect(page.getByText('Spotpris')).not.toBeVisible()

    // Enable fixed spot price — find the switch in the Priser card
    const pricingSection = page.locator('text=Fast spotpris').locator('../..')
    await pricingSection.getByRole('switch').click()

    // Slider label and current value should now appear
    await expect(page.getByText('Spotpris')).toBeVisible()
    await expect(page.getByText(/\d+ øre\/kWh/)).toBeVisible()
  })
})
