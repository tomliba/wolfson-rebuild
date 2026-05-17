import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'dashboard-filter');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

try {
  console.log('1. Navigate to dashboard');
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-dashboard-initial.png'), fullPage: true });

  // Check month selector is visible (should show current month - May 2026)
  const monthText = await page.locator('text=מאי 2026').isVisible();
  check('Month selector shows מאי 2026', monthText);

  // Get stat card values for May
  const statCards = page.locator('[class*="stat-card"], .grid.grid-cols-2 > div');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-may-stats.png'), fullPage: true });

  // Read the surgery count stat card (2nd card)
  const surgeryCard = page.locator('text=ניתוחים').first().locator('..');
  const surgeryValue = await surgeryCard.locator('span, p, div').filter({ hasText: /^\d+$/ }).first().textContent().catch(() => 'N/A');
  console.log(`   May surgery count: ${surgeryValue}`);
  check('May shows surgeries > 0', parseInt(surgeryValue) > 0);

  // Navigate to July (2 clicks forward)
  console.log('2. Navigate to July');
  const nextBtn = page.locator('button:has(svg.lucide-chevron-left)');
  await nextBtn.click();
  await page.waitForTimeout(500);
  await nextBtn.click();
  await page.waitForTimeout(500);

  const julyText = await page.locator('text=יולי 2026').isVisible();
  check('Month selector shows יולי 2026', julyText);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-july-stats.png'), fullPage: true });

  // Read the surgery count for July
  const surgeryValueJuly = await surgeryCard.locator('span, p, div').filter({ hasText: /^\d+$/ }).first().textContent().catch(() => '0');
  console.log(`   July surgery count: ${surgeryValueJuly}`);
  check('July shows 0 surgeries', parseInt(surgeryValueJuly || '0') === 0);

  // Navigate back to May (2 clicks back)
  console.log('3. Navigate back to May');
  const prevBtn = page.locator('button:has(svg.lucide-chevron-right)');
  await prevBtn.click();
  await page.waitForTimeout(500);
  await prevBtn.click();
  await page.waitForTimeout(500);

  const mayAgain = await page.locator('text=מאי 2026').isVisible();
  check('Month selector shows מאי 2026 again', mayAgain);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-may-again.png'), fullPage: true });

  const surgeryValueMayAgain = await surgeryCard.locator('span, p, div').filter({ hasText: /^\d+$/ }).first().textContent().catch(() => 'N/A');
  console.log(`   May again surgery count: ${surgeryValueMayAgain}`);
  check('May again shows surgeries > 0', parseInt(surgeryValueMayAgain) > 0);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
await browser.close();
