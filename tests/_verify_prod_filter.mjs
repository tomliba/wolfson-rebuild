import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROD_URL = 'https://wolfsonrebuild.vercel.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'prod-filter');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Login
console.log('1. Logging in...');
await page.goto(`${PROD_URL}/login`, { waitUntil: 'load', timeout: 30000 });
await page.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL);
await page.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD);
await page.locator('button[type="submit"]').click();
await page.waitForURL(`${PROD_URL}/`, { timeout: 15000 });
await page.waitForTimeout(3000);
console.log('   Logged in.');

// Screenshot May (default)
console.log('2. May (default)');
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-may.png'), fullPage: true });

// Get all text content from stat cards area
const pageText = await page.textContent('body');
console.log('   Month label visible:', await page.locator('text=מאי 2026').isVisible());

// Click forward to June
console.log('3. Click to June');
await page.locator('button:has(svg.lucide-chevron-left)').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-june.png'), fullPage: true });
console.log('   June label visible:', await page.locator('text=יוני 2026').isVisible());

// Click forward to July
console.log('4. Click to July');
await page.locator('button:has(svg.lucide-chevron-left)').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-july.png'), fullPage: true });
console.log('   July label visible:', await page.locator('text=יולי 2026').isVisible());

// Click back to May
console.log('5. Click back to May');
await page.locator('button:has(svg.lucide-chevron-right)').click();
await page.waitForTimeout(500);
await page.locator('button:has(svg.lucide-chevron-right)').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-may-again.png'), fullPage: true });
console.log('   May label visible:', await page.locator('text=מאי 2026').isVisible());

await browser.close();
console.log('Done.');
