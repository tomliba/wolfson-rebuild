import { chromium } from 'playwright';
import path from 'path';

const DIR = path.join('tests', 'screenshots', 'echarts');
const EMAIL = 'tomliba1996@gmail.com';
const PASSWORD = 'Wolfson2026!';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Dashboard - scroll down to see summary card
  await page.screenshot({ path: path.join(DIR, 'summary-month.png'), fullPage: false });
  console.log('Month view captured');

  // Click year tab
  const yearBtn = page.locator('button:has-text("2026")').first();
  await yearBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'summary-year.png'), fullPage: false });
  console.log('Year view captured');

  // Click month tab back
  const monthBtn = page.locator('button:has-text("מאי")').first();
  await monthBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'summary-month-back.png'), fullPage: false });
  console.log('Month view back captured');

  await browser.close();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
