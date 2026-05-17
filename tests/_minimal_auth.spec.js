import { test, expect } from '@playwright/test';

test('minimal login test', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();

  console.log('Going to /login...');
  const response = await page.goto('/login');
  console.log('Response status:', response?.status());
  console.log('URL after goto:', page.url());

  await page.waitForLoadState('domcontentloaded');
  console.log('domcontentloaded done');

  const emailInput = page.locator('input[name="email"]');
  const count = await emailInput.count();
  console.log('email input count:', count);

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  console.log('email input visible');

  await emailInput.fill('test@test.com');
  console.log('fill done');

  await context.close();
});
