import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug-admin-full.png'), fullPage: true });
console.log('Screenshot saved to tests/screenshots/debug-admin-full.png');

await browser.close();
