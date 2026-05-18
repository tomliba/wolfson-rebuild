import { chromium } from 'playwright';
import path from 'path';

const DIR = path.join('tests', 'screenshots', 'echarts');
const EMAIL = 'rich1@test.com';
const PASSWORD = 'TestPass123!';

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

  // Scroll down to summary card
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'summary2-month.png'), fullPage: false });
  console.log('Month view captured (test resident)');

  // Click the 2026 tab in the summary card - be specific
  const summaryCard = page.locator('text=סיכום ניתוחים').locator('..');
  const yearTab = summaryCard.locator('button', { hasText: '2026' });
  await yearTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'summary2-year.png'), fullPage: false });
  console.log('Year view captured (test resident)');

  await browser.close();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
