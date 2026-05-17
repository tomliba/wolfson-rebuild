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
  pageErrors.push(err.stack || err.message);
});

try {
  // Use the Videos page which has a simpler form (no step checkboxes that crash)
  console.log('1. Navigating to /videos...');
  await page.goto('http://localhost:3000/videos', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open the form
  console.log('2. Opening video form...');
  const newBtn = page.locator('button', { hasText: 'סרט חדש' });
  await newBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-1-form-open.png'), fullPage: true });

  // Get the current date displayed in the date button
  const dateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  const dateBefore = await dateBtn.textContent();
  console.log('3. Current date shown:', dateBefore?.trim());

  // Click to open the calendar popover
  console.log('4. Opening calendar popover...');
  await dateBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-2-calendar-open.png'), fullPage: true });

  // Check if the calendar/popover is visible
  const calendarVisible = await page.locator('[role="grid"]').isVisible().catch(() => false);
  console.log('   Calendar grid visible:', calendarVisible);

  if (calendarVisible) {
    // Find a day button to click (try day 10 or any available day)
    const dayButtons = page.locator('button[name="day"]');
    const dayCount = await dayButtons.count();
    console.log('   Day buttons found (name="day"):', dayCount);

    // Try different selectors for day buttons
    const allDayBtns = page.locator('table button:not([disabled])');
    const allDayCount = await allDayBtns.count();
    console.log('   Table buttons (not disabled):', allDayCount);

    // List all buttons in the calendar
    const gridBtns = page.locator('[role="grid"] button, [role="gridcell"] button, td button');
    const gridBtnCount = await gridBtns.count();
    console.log('   Grid/cell/td buttons:', gridBtnCount);

    // Try to find day cells
    const dayCells = page.locator('[role="gridcell"]');
    const cellCount = await dayCells.count();
    console.log('   Grid cells:', cellCount);

    // Inspect the calendar HTML structure
    const calendarHTML = await page.locator('[role="grid"]').evaluate(el => el.outerHTML).catch(() => 'not found');
    console.log('   Calendar HTML (500ch):', calendarHTML?.slice(0, 500));

    // Try clicking day 1
    const day1 = page.locator('button', { hasText: /^1$/ }).first();
    const day1Visible = await day1.isVisible().catch(() => false);
    console.log('   Day "1" button visible:', day1Visible);

    if (day1Visible) {
      console.log('5. Clicking day 1...');
      await day1.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-3-after-day-click.png'), fullPage: true });

      // Check if the calendar closed (popover should close on select)
      const calendarStillVisible = await page.locator('[role="grid"]').isVisible().catch(() => false);
      console.log('   Calendar still visible after click:', calendarStillVisible);

      // Check if the date changed
      const dateAfter = await dateBtn.textContent().catch(() => 'button gone');
      console.log('   Date after click:', dateAfter?.trim());
      console.log('   Date changed:', dateBefore?.trim() !== dateAfter?.trim());
    }

    // Also try clicking a different day (like 15)
    const day15 = page.locator('button', { hasText: /^15$/ }).first();
    if (await day15.isVisible().catch(() => false)) {
      // Re-open calendar if it closed
      if (!(await page.locator('[role="grid"]').isVisible().catch(() => false))) {
        await dateBtn.click();
        await page.waitForTimeout(500);
      }
      console.log('6. Clicking day 15...');
      await day15.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-4-after-day15-click.png'), fullPage: true });
      const dateAfter15 = await dateBtn.textContent().catch(() => 'button gone');
      console.log('   Date after clicking 15:', dateAfter15?.trim());
    }
  } else {
    console.log('   Calendar NOT visible. Checking for DayPicker...');
    const dpVisible = await page.locator('.rdp').isVisible().catch(() => false);
    console.log('   .rdp visible:', dpVisible);

    // Check what the popover contains
    const popoverContent = await page.locator('[data-radix-popper-content-wrapper]').textContent().catch(() => 'not found');
    console.log('   Popover content:', popoverContent?.slice(0, 300));
  }

} catch (err) {
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-error.png'), fullPage: true }).catch(() => {});
}

const output = [
  '=== BUG B: Calendar Click Reproduction ===',
  '',
  '--- Console Messages ---',
  ...consoleMessages,
  '',
  '--- Page Errors ---',
  ...pageErrors.map((e, i) => `Error ${i + 1}: ${e}`),
  '',
  `Total console messages: ${consoleMessages.length}`,
  `Total page errors: ${pageErrors.length}`,
].join('\n');

fs.writeFileSync(path.join(process.cwd(), 'tests', 'bug-b-console.txt'), output);
console.log('\nSaved to tests/bug-b-console.txt');

await browser.close();
