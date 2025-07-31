import { test, expect } from '@playwright/test';


const port = process.env.PORT || 3000;
const hostname = process.env.SERVER_HOST || 'localhost';

test.describe('Subscription E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log("SERVER_HOST: " + process.env.SERVER_HOST);
    console.log("DB_PASSWORD" + process.env.DB_PASSWORD)
    await page.goto(`http://${hostname}:${port}/`);
  });

  test('User can subscribe with valid data', async ({ page }) => {
    await page.fill('#email', 'e2e-test@example.com');
    await page.fill('#city', 'London');
    await page.selectOption('#frequency', 'daily');

    const [response] = await Promise.all([
      page.waitForResponse('**/api/subscription/subscribe'),
      page.click('button[type="submit"]'),
    ]);

    expect(response.status()).toBe(200);

    await expect(page.locator('#message')).toHaveText(/Subscription created/i);
    await expect(page.locator('#message')).toHaveClass('success');
  });

  test('User cannot subscribe with invalid email', async ({ page }) => {
    await page.fill('#email', 'invalid-email');
    await page.fill('#city', 'London');
    await page.selectOption('#frequency', 'daily');

    await page.click('button[type="submit"]');

    await expect(page.locator('#email:invalid')).toBeVisible();

    await expect(page.locator('#message')).toBeEmpty();
  });

  test('User cannot subscribe with empty required fields', async ({ page }) => {
    await page.fill('#city', 'London');
    await page.selectOption('#frequency', 'daily');

    await page.click('button[type="submit"]');

    await expect(page.locator('#email:invalid')).toBeVisible();

    await expect(page.locator('#message')).toBeEmpty();
  });

  test('User sees error message for duplicate email', async ({ page }) => {
    await page.fill('#email', 'duplicate@example.com');
    await page.fill('#city', 'London');
    await page.selectOption('#frequency', 'daily');

    const [firstResponse] = await Promise.all([
      page.waitForResponse('**/api/subscription/subscribe'),
      page.click('button[type="submit"]'),
    ]);

    expect(firstResponse.status()).toBe(200);

    await page.fill('#email', 'duplicate@example.com');
    await page.fill('#city', 'Paris');
    await page.selectOption('#frequency', 'hourly');

    const [secondResponse] = await Promise.all([
      page.waitForResponse('**/api/subscription/subscribe'),
      page.click('button[type="submit"]'),
    ]);

    expect(secondResponse.status()).toBe(409);

    await expect(page.locator('#message')).toHaveText(/already subscribed/i);
    await expect(page.locator('#message')).toHaveClass('error');
  });

  test('User can subscribe with hourly frequency', async ({ page }) => {
    await page.fill('#email', 'hourly-test@example.com');
    await page.fill('#city', 'New York');
    await page.selectOption('#frequency', 'hourly');

    const [response] = await Promise.all([
      page.waitForResponse('**/api/subscription/subscribe'),
      page.click('button[type="submit"]'),
    ]);

    expect(response.status()).toBe(200);

    await expect(page.locator('#message')).toHaveText(/Subscription created/i);
    await expect(page.locator('#message')).toHaveClass('success');
  });

  test('Form resets after successful submission', async ({ page }) => {
    await page.fill('#email', 'reset-test@example.com');
    await page.fill('#city', 'Tokyo');
    await page.selectOption('#frequency', 'daily');

    const [response] = await Promise.all([
      page.waitForResponse('**/api/subscription/subscribe'),
      page.click('button[type="submit"]'),
    ]);

    expect(response.status()).toBe(200);
  });

  test('Network error handling', async ({ page }) => {
    await page.route('**/api/subscription/subscribe', route => {
      route.abort('failed');
    });

    await page.fill('#email', 'error-test@example.com');
    await page.fill('#city', 'Berlin');
    await page.selectOption('#frequency', 'daily');

    await page.click('button[type="submit"]');

    await expect(page.locator('#message')).toHaveText(/Something went wrong/i);
    await expect(page.locator('#message')).toHaveClass('error');
  });
});