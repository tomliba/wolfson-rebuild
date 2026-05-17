import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

// Screenshot the top area
await page.screenshot({ path: path.join(process.cwd(), 'tests', 'screenshots', 'debug-admin-top.png'), fullPage: false });

// Check what buttons exist in the header area
const buttons = await page.locator('button').allTextContents();
console.log('All buttons on page:', buttons);

// Check specifically for the report builder button
const reportBtn = await page.locator('text=בניית דוח למצגת').isVisible().catch(() => false);
console.log('Report builder button visible:', reportBtn);

// Check if the button is off-screen (wrapping)
const btnLoc = page.locator('button', { hasText: 'בניית דוח למצגת' });
const btnCount = await btnLoc.count();
console.log('Report builder button count:', btnCount);
if (btnCount > 0) {
  const box = await btnLoc.first().boundingBox();
  console.log('Button bounding box:', box);
}

// Check viewport
const viewport = page.viewportSize();
console.log('Viewport:', viewport);

if (errors.length > 0) {
  console.log('Page errors:');
  errors.forEach(e => console.log(' ', e.slice(0, 200)));
}

await browser.close();
