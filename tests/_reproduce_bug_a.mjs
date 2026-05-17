import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bugs');

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
  pageErrors.push(err.message);
});

try {
  // Step 1: Navigate to /surgeries
  console.log('1. Navigating to /surgeries...');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-1-surgeries-page.png'), fullPage: true });
  console.log('   URL:', page.url());
  const pageText = await page.textContent('body').catch(() => 'EMPTY');
  console.log('   Page text (200ch):', pageText?.slice(0, 200));

  // Step 2: Click "ניתוח חדש" button
  console.log('2. Clicking "ניתוח חדש" button...');
  const newBtn = page.locator('button', { hasText: 'ניתוח חדש' });
  const btnVisible = await newBtn.isVisible().catch(() => false);
  console.log('   Button visible:', btnVisible);

  if (btnVisible) {
    await newBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-2-form-open.png'), fullPage: true });
    console.log('   Form opened. Console errors so far:', pageErrors.length);

    // Step 3: Click first step checkbox (פתחים)
    console.log('3. Clicking step checkbox (פתחים)...');

    // Find the step checkbox area
    const stepDiv = page.locator('text=פתחים').first();
    const stepVisible = await stepDiv.isVisible().catch(() => false);
    console.log('   "פתחים" visible:', stepVisible);

    if (stepVisible) {
      await stepDiv.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-3-after-step-click.png'), fullPage: true });
      console.log('   After step click. Page errors:', pageErrors.length);
    }

    // Step 4: Try clicking multiple steps
    console.log('4. Clicking more steps...');
    const steps = ['רקסיס', 'הידרודיסקציה'];
    for (const step of steps) {
      const el = page.locator(`text=${step}`).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        await page.waitForTimeout(500);
        console.log(`   Clicked "${step}" - errors: ${pageErrors.length}`);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-4-multiple-steps.png'), fullPage: true });

    // Step 5: Try to fill the form and submit
    console.log('5. Trying to fill remaining fields...');
    const patientInput = page.locator('input[placeholder="לדוגמה: א.כ"]');
    if (await patientInput.isVisible().catch(() => false)) {
      await patientInput.fill('ט.ט');
    }

    // Try to submit
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible().catch(() => false)) {
      console.log('6. Submitting form...');
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-5-after-submit.png'), fullPage: true });
      console.log('   After submit. Page errors:', pageErrors.length);
    }

  } else {
    console.log('   Button NOT visible. Page might have crashed or redirected.');
    console.log('   Current URL:', page.url());
  }

} catch (err) {
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-error.png'), fullPage: true }).catch(() => {});
}

// Write console output
const output = [
  '=== BUG A: Surgeries Page Crash Reproduction ===',
  '',
  '--- Console Messages ---',
  ...consoleMessages,
  '',
  '--- Page Errors (uncaught exceptions) ---',
  ...pageErrors.map((e, i) => `Error ${i + 1}: ${e}`),
  '',
  `Total console messages: ${consoleMessages.length}`,
  `Total page errors: ${pageErrors.length}`,
].join('\n');

fs.writeFileSync(path.join(process.cwd(), 'tests', 'bug-a-console.txt'), output);
console.log('\nOutput saved to tests/bug-a-console.txt');
console.log('Page errors:', pageErrors.length);
if (pageErrors.length > 0) {
  console.log('ERRORS:');
  pageErrors.forEach(e => console.log('  ', e.slice(0, 300)));
}

await browser.close();
