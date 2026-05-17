import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'https://wolfsonrebuild.vercel.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'google-auth');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capture the response body from the Supabase authorize endpoint
let authResponseBody = null;
page.on('response', async (res) => {
  if (res.url().includes('/auth/v1/authorize') && res.status() >= 400) {
    try {
      authResponseBody = await res.text();
    } catch {}
  }
});

console.log('1. Go to login page');
await page.goto(`${PROD_URL}/login`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2000);

console.log('2. Click "Continue with Google"');
await page.locator('text=Continue with Google').click();
await page.waitForTimeout(5000);

const currentUrl = page.url();
console.log(`   URL after click: ${currentUrl}`);

if (authResponseBody) {
  console.log(`   Auth response body: ${authResponseBody}`);
}

// Check page content
const bodyText = await page.textContent('body').catch(() => '');
if (bodyText.length < 500) {
  console.log(`   Page content: ${bodyText.trim()}`);
}

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-retry.png'), fullPage: true });

// Also test localhost
console.log('\n3. Testing on localhost:3000...');
await page.goto('http://localhost:3000/login', { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(1000);
await page.locator('text=Continue with Google').click();
await page.waitForTimeout(5000);
console.log(`   Localhost URL: ${page.url()}`);

if (authResponseBody) {
  console.log(`   Localhost auth response: ${authResponseBody}`);
}

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-localhost-retry.png'), fullPage: true });

await browser.close();
