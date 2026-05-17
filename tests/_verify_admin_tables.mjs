import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'admin-tables');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

try {
  // 1. Go to admin panel
  console.log('1. Navigate to admin panel');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
  // Wait for the page to fully render (skeleton disappears, real content appears)
  await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-admin-overview.png'), fullPage: true });

  // Check resident cards are visible
  const residentCards = page.locator('text=דנה כהן');
  check('Resident דנה כהן visible', await residentCards.first().isVisible());

  const yossiCard = page.locator('text=יוסי לוי');
  check('Resident יוסי לוי visible', await yossiCard.first().isVisible());

  const michalCard = page.locator('text=מיכל אברהם');
  check('Resident מיכל אברהם visible', await michalCard.first().isVisible());

  // 2. Check Section 1: Surgery summary table
  console.log('2. Check surgery summary table');
  const summaryHeader = page.locator('text=סיכום ניתוחים למתמחים');
  check('Section 1 header visible', await summaryHeader.isVisible());

  // 3. Check Section 2: Surgeries by supervisor
  console.log('3. Check surgeries by supervisor');
  const supervisorHeader = page.locator('text=ניתוחים לפי מנתח מפקח');
  check('Section 2 header visible', await supervisorHeader.isVisible());

  // 4. Check Section 3: Stage progression
  console.log('4. Check stage progression table');
  const progressionHeader = page.locator('text=התקדמות שלבי ניתוח');
  check('Section 3 header visible', await progressionHeader.isVisible());

  // 5. Check Excel button
  console.log('5. Check Excel export button');
  const excelBtn = page.locator('text=ייצוא לאקסל');
  check('Excel button visible', await excelBtn.first().isVisible());

  // Scroll down to see all tables
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-section1-summary.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-section2-supervisor.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-section3-progression.png'), fullPage: false });

  // Full page screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-full-page.png'), fullPage: true });

  // 6. Change month to March and verify filtering
  console.log('6. Change month to March');
  const monthSelect = page.locator('button[role="combobox"]').first();
  await monthSelect.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]', { hasText: 'מרץ' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-march-filtered.png'), fullPage: true });

  // 7. Change back to May
  console.log('7. Change back to May');
  await monthSelect.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]', { hasText: 'מאי' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-may-filtered.png'), fullPage: true });

  // 8. Click a resident card to verify drill-down still works
  console.log('8. Click resident card');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const danaCard = page.locator('.cursor-pointer:has-text("דנה כהן")').first();
  await danaCard.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-resident-detail.png'), fullPage: true });

  const detailHeader = page.locator('h1:has-text("דנה כהן")');
  check('Resident detail view works', await detailHeader.isVisible());

  // Go back
  await page.locator('text=חזרה לרשימת מתמחים').click();
  await page.waitForTimeout(1000);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
await browser.close();
