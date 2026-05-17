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

const consoleMessages = [];
const networkErrors = [];
page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
page.on('response', res => {
  if (res.status() >= 400) {
    networkErrors.push(`${res.status()} ${res.url()}`);
  }
});

console.log('1. Go to login page');
await page.goto(`${PROD_URL}/login`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login.png'), fullPage: true });

console.log('2. Click "Continue with Google"');
await page.locator('text=Continue with Google').click();
await page.waitForTimeout(5000);

const currentUrl = page.url();
console.log(`   Current URL: ${currentUrl}`);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-after-google-click.png'), fullPage: true });

// Check where we ended up
if (currentUrl.includes('accounts.google.com')) {
  console.log('   SUCCESS: Redirected to Google sign-in page');
} else if (currentUrl.includes('supabase')) {
  console.log('   Redirected to Supabase (might need Google provider config)');
} else if (currentUrl.includes('/login')) {
  console.log('   STAYED on login page - checking for errors');
  const pageText = await page.textContent('body');
  const errorText = pageText.match(/error[^"]*|Error[^"]*/g);
  if (errorText) console.log('   Errors found:', errorText.slice(0, 3));
}

// Check for any error on the page
const errorEl = await page.locator('.text-red-600, [role="alert"]').textContent().catch(() => null);
if (errorEl) console.log(`   Error message: ${errorEl}`);

console.log('\nConsole messages:');
consoleMessages.forEach(m => console.log(`  ${m}`));

console.log('\nNetwork errors:');
networkErrors.forEach(e => console.log(`  ${e}`));

await browser.close();
