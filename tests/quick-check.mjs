import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

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

  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.locator('text=בניית דוח למצגת').click();
  await page.waitForTimeout(2000);

  const dialog = page.locator('[role="dialog"]');

  // Scroll to cards 4+5
  await dialog.evaluate(el => el.scrollTop = 1200);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, 'fix-card4-card5.png'), fullPage: false });

  await dialog.evaluate(el => el.scrollTop = 1600);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, 'fix-card5-bottom.png'), fullPage: false });

  await browser.close();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
