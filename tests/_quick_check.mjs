import { chromium } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(e => console.log('  ', e.slice(0, 300)));
} else {
  console.log('No errors. Page loaded OK.');
}

const isLoaded = await page.locator('text=פאנל ניהול').isVisible().catch(() => false);
console.log('Admin panel visible:', isLoaded);

const reportBtn = await page.locator('text=בניית דוח למצגת').isVisible().catch(() => false);
console.log('Report builder button visible:', reportBtn);

await browser.close();
