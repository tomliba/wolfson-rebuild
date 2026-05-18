import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const DIR = path.join('tests', 'screenshots', 'hide-resident');
fs.mkdirSync(DIR, { recursive: true });

const EMAIL = 'tomliba1996@gmail.com';
const PASSWORD = 'Wolfson2026!';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Login
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('Logged in');

  // Go to admin panel
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 1: Verify all 8 residents visible
  await page.screenshot({ path: path.join(DIR, '01-all-residents.png'), fullPage: false });
  const residentCards = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('text=@test.com') });
  const count = await residentCards.count();
  console.log(`Step 1: ${count} test residents visible`);

  // Step 2: Scroll down to see admin tables before hiding
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '02-table-before.png'), fullPage: false });
  console.log('Step 2: Table before hiding captured');

  // Step 3: Scroll back up and hide one resident (click the eye icon on the first test resident card)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Find the eye button on a specific resident - let's hide "כרמל עוז"
  const targetCard = page.locator('text=כרמל עוז').locator('..').locator('..');
  const eyeBtn = targetCard.locator('button[title="הסתר מתמחה"]');
  await eyeBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, '03-after-hide.png'), fullPage: false });
  console.log('Step 3: Hid כרמל עוז');

  // Step 4: Verify the hidden resident is gone from main list
  const visibleCount = await residentCards.count();
  console.log(`Step 4: ${visibleCount} test residents visible after hiding`);

  // Step 5: Verify admin table excludes hidden resident
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '04-table-after-hide.png'), fullPage: false });
  console.log('Step 5: Table after hiding captured');

  // Step 6: Open report builder, verify hidden resident excluded
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const reportBtn = page.locator('text=בניית דוח למצגת');
  await reportBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '05-report-builder-no-hidden.png'), fullPage: false });
  console.log('Step 6: Report builder without hidden resident');

  // Close report builder
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Step 7: Click "הצג מתמחים מוסתרים" toggle
  const showHiddenBtn = page.locator('button:has-text("הצג מתמחים מוסתרים")');
  await showHiddenBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '06-show-hidden.png'), fullPage: false });
  console.log('Step 7: Show hidden toggle clicked');

  // Step 8: Verify hidden resident appears grayed out at bottom
  const allCards = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('text=@test.com') });
  const totalCount = await allCards.count();
  console.log(`Step 8: ${totalCount} total test residents (including hidden)`);

  // Step 9: Unhide the resident
  const hiddenCard = page.locator('text=כרמל עוז').locator('..').locator('..');
  const unhideBtn = hiddenCard.locator('button[title="הצג מתמחה"]');
  await unhideBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, '07-after-unhide.png'), fullPage: false });
  console.log('Step 9: Unhid כרמל עוז');

  // Step 10: Test Excel export
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
    page.locator('button:has-text("ייצוא לאקסל")').click(),
  ]);
  if (download) {
    const suggestedName = download.suggestedFilename();
    await download.saveAs(path.join(DIR, `download-${suggestedName}`));
    console.log(`Step 10: Excel downloaded: ${suggestedName}`);
  } else {
    console.log('Step 10: No download event');
  }

  await page.screenshot({ path: path.join(DIR, '08-final.png'), fullPage: false });

  await browser.close();
  console.log('Done! Screenshots saved to', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
