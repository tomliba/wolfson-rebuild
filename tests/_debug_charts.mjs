import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'charts-debug');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 });
await page.waitForTimeout(2000);

await page.locator('button', { hasText: 'בניית דוח למצגת' }).click();
await page.waitForTimeout(3000);

// Screenshot top cards
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-top.png'), fullPage: false });

// Scroll to see all cards
const dialog = page.locator('[role="dialog"]');
await dialog.evaluate(el => el.scrollTop = 0);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-cards-top.png'), fullPage: true });

// Scroll to middle
await dialog.evaluate(el => el.scrollTop = el.scrollHeight / 2);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-cards-middle.png') });

// Scroll to bottom
await dialog.evaluate(el => el.scrollTop = el.scrollHeight);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-cards-bottom.png') });

await browser.close();
console.log('Screenshots saved to tests/screenshots/charts-debug/');
