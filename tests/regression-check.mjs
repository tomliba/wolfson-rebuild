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
  console.log('Logged in');

  // Dashboard page - check recharts still works
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, 'regression-dashboard.png'), fullPage: false });
  console.log('Dashboard screenshot taken');

  // Check for console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  // Navigate to key pages
  await page.goto('http://localhost:3000/surgeries');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, 'regression-surgeries.png'), fullPage: false });
  console.log('Surgeries page OK');

  await page.goto('http://localhost:3000/tasks');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, 'regression-tasks.png'), fullPage: false });
  console.log('Tasks page OK');

  await page.goto('http://localhost:3000/videos');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(DIR, 'regression-videos.png'), fullPage: false });
  console.log('Videos page OK');

  if (errors.length > 0) {
    console.log('Console errors:', errors);
  } else {
    console.log('No console errors detected');
  }

  await browser.close();
  console.log('Regression check complete');
}

run().catch(e => { console.error(e); process.exit(1); });
