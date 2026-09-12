import { expect, test } from '@playwright/test';

// Stubs the refresh endpoint at the network layer (no real backend needed, so this stays CI-safe
// even though web's e2e job doesn't provision `api`/`db`) - only checking that the client actually
// fires the restore-session call on mount, not what the backend does with it.

test('restores the end-user session by calling /auth/refresh on mount', async ({ page }) => {
  let called = false;
  await page.route('**/api/auth/refresh', async (route) => {
    called = true;
    await route.fulfill({ status: 401, json: { message: 'No refresh token' } });
  });

  await page.goto('/en/login');

  await expect.poll(() => called).toBe(true);
});

test('restores the staff session by calling /auth/staff/refresh on mount', async ({ page }) => {
  let called = false;
  await page.route('**/api/auth/staff/refresh', async (route) => {
    called = true;
    await route.fulfill({ status: 401, json: { message: 'No refresh token' } });
  });

  await page.goto('/en/admin/login');

  await expect.poll(() => called).toBe(true);
});
