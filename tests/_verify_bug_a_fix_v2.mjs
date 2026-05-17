import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bug-a-fix');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

page.on('pageerror', err => { pageErrors.push(err.message); });

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

try {
  // Navigate
  console.log('1. Navigate to /surgeries');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open form
  console.log('2. Open form');
  await page.locator('button', { hasText: 'ניתוח חדש' }).click();
  await page.waitForTimeout(1000);
  check('Form opened', await page.locator('text=תיעוד ניתוח חדש').isVisible());

  // Toggle steps
  console.log('3. Toggle steps');
  await page.locator('text=פתחים').first().click();
  await page.waitForTimeout(500);
  check('Step פתחים - no crash', pageErrors.length === 0);

  await page.locator('text=רקסיס').first().click();
  await page.waitForTimeout(500);
  check('Step רקסיס - no crash', pageErrors.length === 0);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-steps-toggled.png'), fullPage: true });

  // Toggle complex type
  console.log('4. Toggle complex type');
  await page.locator('text=הרחבת אישון').first().click();
  await page.waitForTimeout(500);
  check('Complex type - no crash', pageErrors.length === 0);

  // Toggle complication
  console.log('5. Toggle complication');
  await page.locator('text=קרע בקופסית קדמית').first().click();
  await page.waitForTimeout(500);
  check('Complication - no crash', pageErrors.length === 0);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-all-toggled.png'), fullPage: true });

  // Toggle step off
  console.log('6. Toggle step off');
  await page.locator('text=פתחים').first().click();
  await page.waitForTimeout(500);
  check('Toggle off - no crash', pageErrors.length === 0);

  // Fill form fields
  console.log('7. Fill form');
  // Eye - use the SelectTrigger, then the SelectItem
  const eyeTrigger = page.locator('button[role="combobox"]');
  await eyeTrigger.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]', { hasText: 'ימין' }).click();
  await page.waitForTimeout(300);

  await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('ט.ב');
  await page.locator('input[placeholder="שם המנתח המפקח"]').fill('ד"ר כהן');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-filled.png'), fullPage: true });

  // Submit
  console.log('8. Submit form');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-submitted.png'), fullPage: true });

  const formGone = !(await page.locator('text=תיעוד ניתוח חדש').isVisible().catch(() => false));
  check('Form closed after submit', formGone);
  check('No errors after full flow', pageErrors.length === 0);

  // Clean up test surgery
  const deleteBtn = page.locator('button:has(svg.lucide-trash-2)').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Cleaned up test surgery');
  }

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${pageErrors.length} page errors`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  ERROR:', e.slice(0, 200)));

await browser.close();
