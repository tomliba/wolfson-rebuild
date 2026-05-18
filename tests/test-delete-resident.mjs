import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const DIR = path.join('tests', 'screenshots', 'delete-resident');
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
  await page.waitForTimeout(3000);

  // Screenshot the admin page to see what residents exist
  await page.screenshot({ path: path.join(DIR, '00-admin-page.png'), fullPage: false });
  console.log('Step 0: Admin page screenshot');

  // Get all resident names visible
  const cards = page.locator('[class*="cursor-pointer"]');
  const cardCount = await cards.count();
  console.log(`Found ${cardCount} clickable cards`);

  for (let i = 0; i < Math.min(cardCount, 10); i++) {
    const text = await cards.nth(i).innerText();
    console.log(`  Card ${i}: ${text.substring(0, 60).replace(/\n/g, ' | ')}`);
  }

  // Click the first non-admin resident card
  if (cardCount > 0) {
    await cards.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, '01-detail-view.png'), fullPage: false });
    console.log('Step 1: Opened resident detail view');

    // Scroll to bottom to see the delete link
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, '02-delete-link-visible.png'), fullPage: false });
    console.log('Step 2: Bottom of detail view');

    // Look for the delete button
    const deleteLink = page.locator('button:has-text("מחיקה לצמיתות")');
    const deleteCount = await deleteLink.count();
    console.log(`Delete link found: ${deleteCount}`);

    if (deleteCount > 0) {
      await deleteLink.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, '03-confirm-dialog.png'), fullPage: false });
      console.log('Step 3: Confirmation dialog shown');

      // Click cancel
      const cancelBtn = page.locator('button:has-text("ביטול")');
      await cancelBtn.click();
      await page.waitForTimeout(500);
      console.log('Step 4: Dialog dismissed');
    }
  }

  await browser.close();
  console.log('Done! Screenshots saved to', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
