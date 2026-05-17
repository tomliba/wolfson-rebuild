import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

console.log('Navigating to /login...');
await page.goto('http://localhost:3000/login');
await page.waitForLoadState('networkidle');
console.log('URL after navigate:', page.url());
console.log('Page title:', await page.title());

const emailInput = page.locator('input[name="email"]');
const isVisible = await emailInput.isVisible().catch(() => false);
console.log('input[name="email"] visible:', isVisible);

const allInputs = page.locator('input');
const inputCount = await allInputs.count();
console.log('Total input elements:', inputCount);
for (let i = 0; i < inputCount; i++) {
  const name = await allInputs.nth(i).getAttribute('name');
  const type = await allInputs.nth(i).getAttribute('type');
  console.log(`  input ${i}: name="${name}" type="${type}"`);
}

const bodyText = await page.textContent('body');
console.log('Body text (first 500):', bodyText?.slice(0, 500));

await browser.close();
