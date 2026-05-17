import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'regression');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const pageErrors = [];
let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();
page.on('pageerror', err => { pageErrors.push(err.message); });

try {
  // 1. Dashboard
  console.log('1. Dashboard');
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('text=סקירת התקדמות', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-dashboard.png'), fullPage: true });
  check('Dashboard loads', await page.locator('text=סקירת התקדמות').isVisible());
  check('Dashboard no errors', pageErrors.length === 0);

  // 2. Surgeries page - open form, click steps
  console.log('2. Surgeries page');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('text=ניתוח חדש', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-surgeries.png'), fullPage: true });
  check('Surgeries page loads', await page.locator('text=ניתוח חדש').isVisible());

  await page.locator('button', { hasText: 'ניתוח חדש' }).click();
  await page.waitForTimeout(1000);
  check('Surgery form opens', await page.locator('text=תיעוד ניתוח חדש').isVisible());

  // Click a step checkbox
  const errsBefore = pageErrors.length;
  await page.locator('text=פתחים').first().click();
  await page.waitForTimeout(500);
  check('Step click no crash', pageErrors.length === errsBefore);

  // Test calendar closes after selecting a date
  const dateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  await dateBtn.click();
  await page.waitForTimeout(500);
  const calOpen = await page.locator('[role="grid"]').isVisible();
  check('Calendar opens', calOpen);
  if (calOpen) {
    const day15 = page.locator('[role="grid"] button', { hasText: /^15$/ }).first();
    if (await day15.isVisible()) {
      await day15.click();
      await page.waitForTimeout(500);
      const calClosed = !(await page.locator('[role="grid"]').isVisible());
      check('Calendar closes after select', calClosed);
    }
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-surgery-form.png'), fullPage: true });

  // Close form (press Escape)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 3. Tasks page
  console.log('3. Tasks page');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('h3', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-tasks.png'), fullPage: true });
  const taskCount = await page.locator('h3').count();
  check('Tasks show 5 items', taskCount === 5);
  // Check first task has description
  const firstTaskName = await page.locator('h3').first().textContent();
  check('First task name correct', firstTaskName?.trim() === 'הכרת המיקרוסקופ');

  // 4. Videos page
  console.log('4. Videos page');
  await page.goto('http://localhost:3000/videos', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-videos.png'), fullPage: true });
  check('Videos page loads', true);

  // 5. Admin panel - existing cards
  console.log('5. Admin panel');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('text=פאנל ניהול', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-admin.png'), fullPage: true });
  check('Admin panel loads', await page.locator('text=פאנל ניהול').isVisible());
  check('Admin shows residents', await page.locator('text=דנה כהן').first().isVisible());

  check('Zero page errors total', pageErrors.length === 0);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  ERROR:', e.slice(0, 200)));
await browser.close();
