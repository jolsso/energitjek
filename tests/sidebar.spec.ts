import { test, expect } from '@playwright/test'
import { goToResults } from './helpers'

/**
 * Tests for the results sidebar and Standard/Advanced toggle.
 * All tests start from the results page via goToResults().
 */

test.describe('Standard/Advanced toggle', () => {
  test('starts in Standard mode with only summary cards and payback visible', async ({ page }) => {
    await goToResults(page)

    // Standard mode: advanced charts should NOT be visible
    await expect(page.getByText('Energiflow')).not.toBeVisible()
    await expect(page.getByText('Månedlig oversigt')).not.toBeVisible()
  })

  test('Standard toggle button is active by default', async ({ page }) => {
    await goToResults(page)

    await expect(page.getByRole('button', { name: 'Standard' })).toHaveClass(/bg-card/)
    await expect(page.getByRole('button', { name: 'Avanceret' })).not.toHaveClass(/bg-card/)
  })

  test('switching to Advanced shows additional charts', async ({ page }) => {
    await goToResults(page)

    await page.getByRole('button', { name: 'Avanceret' }).click()

    await expect(page.getByText('Energiflow')).toBeVisible()
    await expect(page.getByText('Månedlig oversigt')).toBeVisible()
    await expect(page.getByText('Månedlig besparelse (DKK)')).toBeVisible()
  })

  test('switching back to Standard hides advanced charts again', async ({ page }) => {
    await goToResults(page)

    await page.getByRole('button', { name: 'Avanceret' }).click()
    await expect(page.getByText('Energiflow')).toBeVisible()

    await page.getByRole('button', { name: 'Standard' }).click()
    await expect(page.getByText('Energiflow')).not.toBeVisible()
  })

  test('Advanced mode shows extra solar config fields (tilt, azimuth, system loss)', async ({ page }) => {
    await goToResults(page)

    // In Standard: only peakKw slider — advanced fields hidden
    await expect(page.getByText('Hældning')).not.toBeVisible()
    await expect(page.getByText('Retning (azimut)')).not.toBeVisible()
    await expect(page.getByText('Systemtab')).not.toBeVisible()

    await page.getByRole('button', { name: 'Avanceret' }).click()

    await expect(page.getByText('Hældning')).toBeVisible()
    await expect(page.getByText('Retning (azimut)')).toBeVisible()
    await expect(page.getByText('Systemtab')).toBeVisible()
  })
})

test.describe('Investering', () => {
  test('investment card is visible in sidebar', async ({ page }) => {
    await goToResults(page)
    await expect(page.getByText('Investering')).toBeVisible()
    await expect(page.getByText('Anlægsomkostning')).toBeVisible()
  })

  test('preset buttons are shown (60k–150k)', async ({ page }) => {
    await goToResults(page)

    await expect(page.getByRole('button', { name: '60k' })).toBeVisible()
    await expect(page.getByRole('button', { name: '80k' })).toBeVisible()
    await expect(page.getByRole('button', { name: '100k' })).toBeVisible()
    await expect(page.getByRole('button', { name: '120k' })).toBeVisible()
    await expect(page.getByRole('button', { name: '150k' })).toBeVisible()
  })

  test('clicking 100k preset selects it and shows the value', async ({ page }) => {
    await goToResults(page)

    await page.getByRole('button', { name: '100k' }).click()

    await expect(page.getByRole('button', { name: '100k' })).toHaveClass(/bg-primary/)
    await expect(page.getByText('100.000 kr.')).toBeVisible()
  })

  test('clicking an active preset deselects it', async ({ page }) => {
    await goToResults(page)

    await page.getByRole('button', { name: '80k' }).click()
    await expect(page.getByText('80.000 kr.')).toBeVisible()

    await page.getByRole('button', { name: '80k' }).click()
    await expect(page.getByText('—')).toBeVisible()
  })

  test('slider goes up to 400.000 kr.', async ({ page }) => {
    await goToResults(page)
    await expect(page.getByText('400.000 kr.')).toBeVisible()
  })

  test('setting investment shows payback chart', async ({ page }) => {
    await goToResults(page)

    // No investment → no payback chart
    await expect(page.getByText('Tilbagebetalingsperiode')).not.toBeVisible()

    await page.getByRole('button', { name: '100k' }).click()

    await expect(page.getByText('Tilbagebetalingsperiode')).toBeVisible()
  })
})

test.describe('Forbrug tillæg', () => {
  test('consumption addons card is visible', async ({ page }) => {
    await goToResults(page)
    await expect(page.getByText('Forbrug tillæg')).toBeVisible()
  })

  test('heatpump toggle is off by default', async ({ page }) => {
    await goToResults(page)

    const heatpumpSwitch = page.locator('text=Varmepumpe').locator('..').getByRole('switch')
    await expect(heatpumpSwitch).toHaveAttribute('aria-checked', 'false')
  })

  test('enabling heatpump shows the kWh addition', async ({ page }) => {
    await goToResults(page)

    const heatpumpSwitch = page.locator('text=Varmepumpe').locator('..').getByRole('switch')
    await heatpumpSwitch.click()

    await expect(heatpumpSwitch).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('+6.500 kWh/år')).toBeVisible()
  })

  test('EV toggle is off by default', async ({ page }) => {
    await goToResults(page)

    const evSwitch = page.locator('text=El-bil').locator('..').getByRole('switch')
    await expect(evSwitch).toHaveAttribute('aria-checked', 'false')
  })

  test('enabling EV shows the km/dag slider', async ({ page }) => {
    await goToResults(page)

    const evSwitch = page.locator('text=El-bil').locator('..').getByRole('switch')
    await evSwitch.click()

    await expect(evSwitch).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText(/\d+ km\/dag/)).toBeVisible()
  })
})

test.describe('Batteri', () => {
  test('battery card is visible in sidebar', async ({ page }) => {
    await goToResults(page)
    await expect(page.getByText('Batteri')).toBeVisible()
  })

  test('battery is disabled by default', async ({ page }) => {
    await goToResults(page)

    const batterySwitch = page.locator('text=Batteri').locator('..').getByRole('switch')
    await expect(batterySwitch).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByText('Kapacitet')).not.toBeVisible()
  })

  test('enabling battery shows the capacity slider', async ({ page }) => {
    await goToResults(page)

    const batterySwitch = page.locator('text=Batteri').locator('..').getByRole('switch')
    await batterySwitch.click()

    await expect(batterySwitch).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Kapacitet')).toBeVisible()
  })

  test('battery strategy options are hidden in Standard mode', async ({ page }) => {
    await goToResults(page)

    const batterySwitch = page.locator('text=Batteri').locator('..').getByRole('switch')
    await batterySwitch.click()

    // Advanced fields should not appear in Standard mode
    await expect(page.getByText('Strategi')).not.toBeVisible()
    await expect(page.getByText('Max. effekt (lade/aflade)')).not.toBeVisible()
  })

  test('battery strategy options are visible in Advanced mode', async ({ page }) => {
    await goToResults(page)

    await page.getByRole('button', { name: 'Avanceret' }).click()

    const batterySwitch = page.locator('text=Batteri').locator('..').getByRole('switch')
    await batterySwitch.click()

    await expect(page.getByText('Strategi')).toBeVisible()
    await expect(page.getByText('Egenforbrug')).toBeVisible()
    await expect(page.getByText('Time-of-use')).toBeVisible()
  })
})
