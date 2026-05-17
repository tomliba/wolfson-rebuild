import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROD_URL = 'https://wolfsonrebuild.vercel.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'prod-verify');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('pageerror', err => { pageErrors.push(err.message); });

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

try {
  // Login
  console.log('1. Logging in on prod...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${PROD_URL}/`, { timeout: 15000 });
  console.log('   Logged in.');

  // Navigate to surgeries
  console.log('2. Navigate to /surgeries');
  await page.goto(`${PROD_URL}/surgeries`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-surgeries.png'), fullPage: true });

  // Open form
  console.log('3. Open surgery form');
  await page.locator('button', { hasText: 'ניתוח חדש' }).click();
  await page.waitForTimeout(1000);
  check('Form opened', await page.locator('text=תיעוד ניתוח חדש').isVisible());

  // Click steps
  console.log('4. Toggle step checkboxes');
  await page.locator('text=פתחים').first().click();
  await page.waitForTimeout(500);
  check('Step פתחים - no crash', pageErrors.length === 0);

  await page.locator('text=רקסיס').first().click();
  await page.waitForTimeout(500);
  check('Step רקסיס - no crash', pageErrors.length === 0);

  await page.locator('text=הידרודיסקציה').first().click();
  await page.waitForTimeout(500);
  check('Step הידרודיסקציה - no crash', pageErrors.length === 0);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-steps-toggled.png'), fullPage: true });

  // Click complex type
  console.log('5. Toggle complex type');
  await page.locator('text=הרחבת אישון').first().click();
  await page.waitForTimeout(500);
  check('Complex type - no crash', pageErrors.length === 0);

  // Click complication
  console.log('6. Toggle complication');
  await page.locator('text=קרע בקופסית קדמית').first().click();
  await page.waitForTimeout(500);
  check('Complication - no crash', pageErrors.length === 0);

  // Test calendar closes
  console.log('7. Test calendar popover');
  const dateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  await dateBtn.click();
  await page.waitForTimeout(500);
  const calOpen = await page.locator('[role="grid"]').isVisible();
  check('Calendar opened', calOpen);

  const day10 = page.locator('[role="grid"] button', { hasText: /^10$/ }).first();
  if (await day10.isVisible()) {
    await day10.click();
    await page.waitForTimeout(500);
    const calClosed = !(await page.locator('[role="grid"]').isVisible());
    check('Calendar closed after select', calClosed);
    check('Date updated', (await dateBtn.textContent()).includes('10'));
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-form-filled.png'), fullPage: true });

  // Fill and submit
  console.log('8. Fill and submit');
  const eyeTrigger = page.locator('button[role="combobox"]');
  await eyeTrigger.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]', { hasText: 'ימין' }).click();
  await page.waitForTimeout(300);

  await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('פ.ר');
  await page.locator('input[placeholder="שם המנתח המפקח"]').fill('ד"ר לוי');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-submitted.png'), fullPage: true });

  const formGone = !(await page.locator('text=תיעוד ניתוח חדש').isVisible().catch(() => false));
  check('Form closed (surgery created)', formGone);
  check('Zero page errors throughout', pageErrors.length === 0);

  // Cleanup
  const deleteBtn = page.locator('button:has(svg.lucide-trash-2)').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Cleaned up test surgery.');
  }

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${pageErrors.length} page errors`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  ERROR:', e.slice(0, 200)));

await browser.close();
