import { expect, test } from '@playwright/test';

// The middleware check only looks at cookie presence (see proxy.ts) - it doesn't need a real
// backend, so these stay CI-safe even though web's e2e job doesn't provision `api`/`db`.

test.describe('without a session cookie', () => {
  test('redirects /dashboard to the end-user login page', async ({ page }) => {
    await page.goto('/en/dashboard');

    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test('redirects /admin/dashboard to the staff login page', async ({ page }) => {
    await page.goto('/en/admin/dashboard');

    await expect(page).toHaveURL(/\/en\/admin\/login$/);
  });

  test('does not redirect the public home page', async ({ page }) => {
    await page.goto('/en');

    await expect(page).toHaveURL(/\/en$/);
  });

  test('does not redirect either login page', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveURL(/\/en\/login$/);

    await page.goto('/en/admin/login');
    await expect(page).toHaveURL(/\/en\/admin\/login$/);
  });
});

test.describe('with a session cookie', () => {
  test('allows /dashboard through when the refresh_token cookie is present', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'refresh_token', value: 'stub', url: baseURL ?? 'http://localhost:3000' },
    ]);

    await page.goto('/en/dashboard');

    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });

  test('allows /admin/dashboard through when the staff_refresh_token cookie is present', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'staff_refresh_token', value: 'stub', url: baseURL ?? 'http://localhost:3000' },
    ]);

    await page.goto('/en/admin/dashboard');

    await expect(page).toHaveURL(/\/en\/admin\/dashboard$/);
  });
});
