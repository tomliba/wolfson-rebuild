import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bug-b-fix');

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

async function testCalendar(label, dateBtn, screenshotPrefix) {
  const dateBefore = await dateBtn.textContent();
  console.log(`  Date before: ${dateBefore?.trim()}`);

  // Open calendar
  await dateBtn.click();
  await page.waitForTimeout(500);
  const calendarVisible = await page.locator('[role="grid"]').isVisible().catch(() => false);
  check(`${label} - calendar opened`, calendarVisible);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-1-open.png`), fullPage: true });

  if (!calendarVisible) return;

  // Click day 10
  const day10 = page.locator('[role="grid"] button', { hasText: /^10$/ }).first();
  if (await day10.isVisible().catch(() => false)) {
    await day10.click();
    await page.waitForTimeout(500);

    const calendarStillVisible = await page.locator('[role="grid"]').isVisible().catch(() => false);
    check(`${label} - popover closed after select`, !calendarStillVisible);

    const dateAfter = await dateBtn.textContent();
    console.log(`  Date after: ${dateAfter?.trim()}`);
    check(`${label} - date updated`, dateAfter?.includes('10'));

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${screenshotPrefix}-2-closed.png`), fullPage: true });
  }
}

try {
  // === Test 1: Surgeries page ===
  console.log('1. Surgeries page calendar');
  await page.goto('http://localhost:3000/surgeries', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ניתוח חדש' }).click();
  await page.waitForTimeout(1000);

  const surgeryDateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  await testCalendar('Surgery date', surgeryDateBtn, 'surgery');

  // Close the form
  await page.locator('button', { hasText: 'ביטול' }).click();
  await page.waitForTimeout(500);

  // === Test 2: Videos page - review date ===
  console.log('\n2. Videos page - review date calendar');
  await page.goto('http://localhost:3000/videos', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'סרט חדש' }).click();
  await page.waitForTimeout(1000);

  const reviewDateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  await testCalendar('Video review date', reviewDateBtn, 'video-review');

  // === Test 3: Videos page - meeting date ===
  console.log('\n3. Videos page - meeting date calendar');
  // Enable the meeting date by checking the checkbox
  const meetingCheckbox = page.locator('text=הוצג בישיבת שמיים');
  if (await meetingCheckbox.isVisible().catch(() => false)) {
    await meetingCheckbox.click();
    await page.waitForTimeout(500);
  }
  const meetingDateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).nth(1);
  if (await meetingDateBtn.isVisible().catch(() => false)) {
    await testCalendar('Video meeting date', meetingDateBtn, 'video-meeting');
  } else {
    console.log('  Skipped - meeting date not visible');
  }

  // Close the form
  await page.locator('button', { hasText: 'ביטול' }).click();
  await page.waitForTimeout(500);

  // === Test 4: Tasks page ===
  console.log('\n4. Tasks page calendar');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Click a task circle to open the completion form
  const circleBtn = page.locator('button:has(svg.lucide-circle)').first();
  if (await circleBtn.isVisible().catch(() => false)) {
    await circleBtn.click();
    await page.waitForTimeout(1000);

    const taskDateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
    if (await taskDateBtn.isVisible().catch(() => false)) {
      await testCalendar('Task completion date', taskDateBtn, 'task');
    }
  }

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${pageErrors.length} page errors`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  ERROR:', e.slice(0, 200)));

await browser.close();
