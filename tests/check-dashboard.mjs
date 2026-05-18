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

  await page.screenshot({ path: path.join(DIR, 'regression-dashboard-root.png'), fullPage: false });
  console.log('Dashboard at / captured');

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
