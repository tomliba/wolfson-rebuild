import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bug-a-fix');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const consoleMessages = [];
const pageErrors = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

page.on('console', msg => {
  consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  pageErrors.push(err.stack || err.message);
});

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

try {
  // Step 1: Navigate
  console.log('1. Navigate to /surgeries');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-surgeries-page.png'), fullPage: true });
  check('Page loaded', page.url().includes('/surgeries'));

  // Step 2: Open form
  console.log('2. Click "ניתוח חדש"');
  await page.locator('button', { hasText: 'ניתוח חדש' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-form-open.png'), fullPage: true });
  const formVisible = await page.locator('text=תיעוד ניתוח חדש').isVisible();
  check('Form opened', formVisible);

  // Step 3: Click step "פתחים"
  console.log('3. Click step "פתחים"');
  const step1 = page.locator('text=פתחים').first();
  await step1.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-step-incisions.png'), fullPage: true });
  check('No crash after step click', pageErrors.length === 0);

  // Check the step is visually selected (parent div should have bg-primary/5)
  const step1Parent = page.locator('div.cursor-pointer:has-text("פתחים")').first();
  const step1Classes = await step1Parent.getAttribute('class');
  check('Step "פתחים" toggled on', step1Classes?.includes('bg-primary/5') || step1Classes?.includes('border-primary'));

  // Step 4: Click step "רקסיס"
  console.log('4. Click step "רקסיס"');
  await page.locator('text=רקסיס').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-step-rhexis.png'), fullPage: true });
  check('No crash after second step', pageErrors.length === 0);

  // Step 5: Click complex type "הרחבת אישון"
  console.log('5. Click complex type "הרחבת אישון"');
  await page.locator('text=הרחבת אישון').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-complex-type.png'), fullPage: true });
  check('No crash after complex type click', pageErrors.length === 0);

  // Step 6: Click complication "קרע בקופסית קדמית"
  console.log('6. Click complication "קרע בקופסית קדמית"');
  await page.locator('text=קרע בקופסית קדמית').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-complication.png'), fullPage: true });
  check('No crash after complication click', pageErrors.length === 0);

  // Step 7: Toggle a step OFF (click פתחים again)
  console.log('7. Toggle step off (click פתחים again)');
  await page.locator('text=פתחים').first().click();
  await page.waitForTimeout(500);
  const step1ClassesAfter = await step1Parent.getAttribute('class');
  check('Step "פתחים" toggled off', !step1ClassesAfter?.includes('bg-primary/5'));
  check('No crash after toggle off', pageErrors.length === 0);

  // Step 8: Fill form fields and submit
  console.log('8. Fill form and submit');
  // Select eye
  await page.locator('button', { hasText: 'בחר עין' }).click();
  await page.waitForTimeout(300);
  await page.locator('text=ימין').click();
  await page.waitForTimeout(300);

  // Fill patient initials
  await page.locator('input[placeholder="לדוגמה: א.כ"]').fill('ט.ב');
  await page.waitForTimeout(200);

  // Fill surgeon
  await page.locator('input[placeholder="שם המנתח המפקח"]').fill('ד"ר כהן');
  await page.waitForTimeout(200);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-form-filled.png'), fullPage: true });

  // Submit
  console.log('9. Submit form');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-after-submit.png'), fullPage: true });

  // Check if the form closed (success) or an error appeared
  const formStillVisible = await page.locator('text=תיעוד ניתוח חדש').isVisible().catch(() => false);
  check('Form closed after submit (surgery created)', !formStillVisible);
  check('No errors after submit', pageErrors.length === 0);

  // Clean up: delete the surgery we just created
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

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Page errors: ${pageErrors.length}`);
if (pageErrors.length > 0) {
  console.log('Errors:');
  pageErrors.forEach(e => console.log('  ', e.slice(0, 200)));
}
if (consoleMessages.length > 0) {
  console.log('Console messages:');
  consoleMessages.forEach(m => console.log('  ', m));
}
console.log('========================================');

await browser.close();
