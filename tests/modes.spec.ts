import { test, expect } from '@playwright/test'

test.describe('Input mode selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('defaults to Eloverblik mode', async ({ page }) => {
    // Eloverblik tab should be visually selected
    const eloverblikBtn = page.getByRole('button', { name: 'Via Eloverblik' })
    await expect(eloverblikBtn).toHaveClass(/border-primary/)

    // Eloverblik form content should be visible
    await expect(page.getByText('Forbind din Eloverblik-konto')).toBeVisible()
  })

  test('switching to Manuel shows address and consumption forms', async ({ page }) => {
    await page.getByRole('button', { name: 'Manuel' }).click()

    await expect(page.getByRole('button', { name: 'Manuel' })).toHaveClass(/border-primary/)
    await expect(page.getByPlaceholder('Søndergade 12, 8000 Aarhus')).toBeVisible()
  })

  test('switching back to Eloverblik hides the manual address form', async ({ page }) => {
    await page.getByRole('button', { name: 'Manuel' }).click()
    await expect(page.getByPlaceholder('Søndergade 12, 8000 Aarhus')).toBeVisible()

    await page.getByRole('button', { name: 'Via Eloverblik' }).click()
    await expect(page.getByPlaceholder('Søndergade 12, 8000 Aarhus')).not.toBeVisible()
  })

  test('Eloverblik mode shows "Anbefalet" badge', async ({ page }) => {
    await expect(page.getByText('Anbefalet')).toBeVisible()
  })

  test('Manuel mode has no badge', async ({ page }) => {
    // Only Eloverblik has "Anbefalet"
    const badges = page.getByText('Anbefalet')
    await expect(badges).toHaveCount(1)
  })

  test('Calculate button is disabled without address in Manual mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Manuel' }).click()

    const calculateBtn = page.getByRole('button', { name: 'Beregn besparelse' })
    await expect(calculateBtn).toBeDisabled()
  })

  test('privacy page can be opened and closed', async ({ page }) => {
    await page.getByRole('link', { name: 'Privatlivspolitik' }).click()
    await expect(page.getByText('Ingen data forlader din enhed')).toBeVisible()

    await page.getByRole('button', { name: 'Tilbage' }).click()
    await expect(page.getByText('Beregn din solcelleøkonomi')).toBeVisible()
  })
})
