import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Infera/);
});

test('can navigate to recording page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Recording');
  await expect(page).toHaveURL(/.*recording/);
  await expect(page.locator('h1')).toContainText('Data Recording');
});
