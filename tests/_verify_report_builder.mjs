import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'report-builder');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;
const pageErrors = [];
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('pageerror', e => pageErrors.push(e.message));

try {
  // 0. Login
  console.log('0. Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('   Logged in.');

  // Save fresh auth state
  await context.storageState({ path: path.join(process.cwd(), 'tests', 'auth-state.json') });

  // 1. Go to admin
  console.log('1. Navigate to admin');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 2. Check report builder button exists
  console.log('2. Check report builder button');
  const reportBtn = page.locator('button', { hasText: 'בניית דוח למצגת' });
  check('Report builder button visible', await reportBtn.isVisible());
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-admin-with-button.png'), fullPage: true });

  // 3. Open report builder
  console.log('3. Open report builder dialog');
  await reportBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-report-builder-open.png'), fullPage: true });

  // Check all 6 card titles
  check('Card 1 visible', await page.locator('text=כמה ניתוחים לכל מתמחה?').isVisible());
  check('Card 2 visible', await page.locator('text=מתי כל מתמחה ניתח?').isVisible());
  check('Card 3 visible', await page.locator('text=לאיזה שלב כל מתמחה הגיע?').isVisible());
  check('Card 4 visible', await page.locator('text=איזה מפקח פיקח על מי?').isVisible());
  check('Card 5 visible', await page.locator('text=כמה ניתוחים פיקח כל מנתח החודש?').isVisible());
  check('Card 6 visible', await page.locator('text=מה שיעור הסיבוכים?').isVisible());

  // Check section labels
  check('Section מתמחים visible', await page.locator('text=מתמחים').first().isVisible());
  check('Section מנתחים מפקחים visible', await page.locator('text=מנתחים מפקחים').isVisible());
  check('Section סטטיסטיקה visible', await page.locator('text=סטטיסטיקה').isVisible());

  // Check selected count
  check('6 charts selected', await page.locator('text=6 תרשימים נבחרו').isVisible());

  // 4. Switch card 1 to bar mode
  console.log('4. Switch card 1 to bar mode');
  await page.locator('button', { hasText: 'עמודות' }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-card1-bar.png'), fullPage: true });

  // 5. Switch card 1 to dots mode
  console.log('5. Switch card 1 to dots mode');
  await page.locator('button', { hasText: 'נקודות' }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-card1-dots.png'), fullPage: true });

  // 6. Toggle top 3 on card 1
  console.log('6. Toggle top 3');
  await page.locator('button', { hasText: '3 מובילים' }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-card1-top3.png'), fullPage: true });

  // 7. Switch card 3 to heatmap
  console.log('7. Switch card 3 to heatmap');
  await page.locator('button', { hasText: 'מפת חום' }).first().click();
  await page.waitForTimeout(1000);

  // Scroll down to see cards 4-6
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) dialog.scrollTop = dialog.scrollHeight;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-bottom-cards.png'), fullPage: true });

  // 8. Scroll back to top for full overview
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) dialog.scrollTop = 0;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-full-overview.png'), fullPage: true });

  // 9. Check bottom bar buttons
  console.log('8. Check bottom bar');
  check('Download pptx button exists', await page.locator('text=הורד מצגת').isVisible());
  check('Download images button exists', await page.locator('text=הורד תמונות').isVisible());

  check('Zero page errors', pageErrors.length === 0);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  PAGE ERROR:', e.slice(0, 200)));
await browser.close();
