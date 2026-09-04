import { expect, test } from '@playwright/test';

test('home page shows the getting-started heading', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/To get started, edit the/i)).toBeVisible();
});

test('home page has a Deploy Now link', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Deploy Now/i })).toBeVisible();
});
