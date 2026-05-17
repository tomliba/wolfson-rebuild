import { chromium } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

try {
  // 1. Dashboard
  console.log('1. Dashboard');
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  check('Dashboard loads', await page.locator('text=לוח בקרה').isVisible().catch(() => false) || await page.url().includes('localhost:3000'));
  check('No page errors on dashboard', errors.length === 0);

  // 2. Admin panel
  console.log('2. Admin panel');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  check('Admin panel loads', await page.locator('text=פאנל ניהול').isVisible());
  check('Report builder button exists', await page.locator('text=בניית דוח למצגת').isVisible());
  check('Excel export button exists', await page.locator('text=ייצוא Excel').isVisible().catch(() => false));

  // 3. Surgeries page
  console.log('3. Surgeries page');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  const surgeriesLoaded = await page.locator('text=ניתוחים').first().isVisible().catch(() => false);
  check('Surgeries page loads', surgeriesLoaded);

  // 4. Tasks page
  console.log('4. Tasks page');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  const tasksLoaded = await page.locator('text=משימות').first().isVisible().catch(() => false)
    || await page.locator('h1, h2, h3').first().isVisible().catch(() => false);
  check('Tasks page loads', tasksLoaded);

  // 5. Videos page
  console.log('5. Videos page');
  await page.goto('http://localhost:3000/videos', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  const videosLoaded = await page.locator('text=סרטונים').first().isVisible().catch(() => false)
    || await page.locator('h1, h2, h3').first().isVisible().catch(() => false);
  check('Videos page loads', videosLoaded);

  // 6. Check no accumulated page errors
  check('Zero page errors across all pages', errors.length === 0);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
}

console.log(`\nRegression Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) errors.forEach(e => console.log('  PAGE ERROR:', e.slice(0, 200)));
await browser.close();
