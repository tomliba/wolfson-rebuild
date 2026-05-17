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

// ===== BUG B: Calendar on Tasks page =====
console.log('=== BUG B: Tasks page calendar ===');
await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-tasks-1-page.png'), fullPage: true });

// Find a task with a completion circle to open the date picker
const circleBtn = page.locator('button:has(svg.lucide-circle)').first();
const circleVisible = await circleBtn.isVisible().catch(() => false);
console.log('Circle (uncompleted) button visible:', circleVisible);

if (circleVisible) {
  await circleBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-tasks-2-form-open.png'), fullPage: true });

  // Find the calendar trigger button in the completion form
  const calBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
  if (await calBtn.isVisible().catch(() => false)) {
    const dateBefore = await calBtn.textContent();
    console.log('Date before:', dateBefore?.trim());

    await calBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-tasks-3-calendar-open.png'), fullPage: true });

    // Click day 5
    const day5 = page.locator('[role="grid"] button', { hasText: /^5$/ }).first();
    if (await day5.isVisible().catch(() => false)) {
      await day5.click();
      await page.waitForTimeout(500);
      const dateAfter = await calBtn.textContent();
      console.log('Date after clicking 5:', dateAfter?.trim());
      console.log('Date changed:', dateBefore?.trim() !== dateAfter?.trim());
    }
  }
}

// ===== BUG B: Test clicking currently selected date =====
console.log('\n=== BUG B: Clicking currently selected date ===');
await page.goto('http://localhost:3000/videos', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

const newBtn = page.locator('button', { hasText: 'סרט חדש' });
await newBtn.click();
await page.waitForTimeout(1000);

const dateBtn = page.locator('button', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
const dateBeforeReclick = await dateBtn.textContent();
console.log('Current date:', dateBeforeReclick?.trim());

// Open calendar
await dateBtn.click();
await page.waitForTimeout(500);

// Click today (the currently selected date - 17)
const today = page.locator('[role="grid"] button.bg-accent, [role="grid"] button[aria-selected="true"]').first();
const todayText = await today.textContent().catch(() => 'not found');
console.log('Today button text:', todayText);
const todayAriaSelected = await today.getAttribute('aria-selected').catch(() => 'not found');
console.log('Today aria-selected:', todayAriaSelected);

if (await today.isVisible().catch(() => false)) {
  await today.click();
  await page.waitForTimeout(500);
  const dateAfterReclick = await dateBtn.textContent();
  console.log('Date after clicking today:', dateAfterReclick?.trim());
  console.log('Date changed (should not):', dateBeforeReclick?.trim() !== dateAfterReclick?.trim());
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-b-reclick-today.png'), fullPage: true });
}

// ===== BUG C: Tasks data =====
console.log('\n=== BUG C: Tasks data ===');
await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-c-1-tasks-page.png'), fullPage: true });

// Get all task names and descriptions
const taskCards = page.locator('.space-y-3 > div > div');
const taskCount = await taskCards.count();
console.log('Task cards found:', taskCount);

// Get the task list content
const taskPageText = await page.locator('.space-y-3').first().textContent().catch(() => 'not found');
console.log('Tasks section text:', taskPageText?.slice(0, 500));

// Look for task names specifically
const taskNames = page.locator('h3');
const nameCount = await taskNames.count();
console.log('Task name h3 elements:', nameCount);

for (let i = 0; i < Math.min(nameCount, 10); i++) {
  const name = await taskNames.nth(i).textContent();
  const parent = taskNames.nth(i).locator('..');
  const desc = await parent.locator('p.text-muted-foreground').first().textContent().catch(() => 'NO DESCRIPTION');
  console.log(`  Task ${i + 1}: "${name}" | Desc: "${desc}"`);
}

// Check the header for task count
const headerText = await page.locator('h1').textContent().catch(() => '');
const subText = await page.locator('p.text-muted-foreground').first().textContent().catch(() => '');
console.log('Header:', headerText);
console.log('Sub-header:', subText);

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'bug-c-2-tasks-detail.png'), fullPage: true });

// Write results
const output = [
  '=== BUG B + C Reproduction Results ===',
  '',
  '--- Console Messages ---',
  ...consoleMessages,
  '',
  '--- Page Errors ---',
  ...pageErrors.map((e, i) => `Error ${i + 1}: ${e}`),
].join('\n');

fs.writeFileSync(path.join(process.cwd(), 'tests', 'bug-bc-console.txt'), output);
console.log('\nSaved to tests/bug-bc-console.txt');

await browser.close();
