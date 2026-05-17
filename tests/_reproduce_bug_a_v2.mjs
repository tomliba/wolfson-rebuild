import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bugs');

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

// Navigate to surgeries
await page.goto('http://localhost:3000/surgeries', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);

// Open form
const newBtn = page.locator('button', { hasText: 'ניתוח חדש' });
await newBtn.click();
await page.waitForTimeout(1000);

// Before clicking the step, inject error catcher
await page.evaluate(() => {
  window.__capturedErrors = [];
  window.addEventListener('error', (e) => {
    window.__capturedErrors.push({
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack?.slice(0, 1000)
    });
  });
});

// Click the step (פתחים)
console.log('Clicking step...');
const stepDiv = page.locator('text=פתחים').first();
await stepDiv.click();
await page.waitForTimeout(2000);

// Capture errors from window
const capturedErrors = await page.evaluate(() => window.__capturedErrors).catch(() => []);

// Check for Next.js error overlay
const nextErrorOverlay = await page.locator('[data-nextjs-dialog]').isVisible().catch(() => false);
const nextErrorText = await page.locator('body').textContent().catch(() => '');

// Also try to find the error description in the overlay
const overlayContent = await page.locator('#nextjs__container_errors_desc, [data-nextjs-dialog-body]').textContent().catch(() => 'not found');

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-a-v2-after-click.png'), fullPage: true });

const output = [
  '=== BUG A V2: Detailed Error Capture ===',
  '',
  '--- Page Errors (with stack traces) ---',
  ...pageErrors.map((e, i) => `Error ${i + 1}:\n${e}\n`),
  '',
  '--- Window Captured Errors ---',
  JSON.stringify(capturedErrors, null, 2),
  '',
  '--- Next.js Error Overlay ---',
  `Visible: ${nextErrorOverlay}`,
  `Overlay content: ${overlayContent}`,
  '',
  '--- Page text after crash (200ch) ---',
  nextErrorText?.slice(0, 500),
  '',
  '--- All Console Messages ---',
  ...consoleMessages,
].join('\n');

fs.writeFileSync(path.join(process.cwd(), 'tests', 'bug-a-console.txt'), output);
console.log(output);

await browser.close();
