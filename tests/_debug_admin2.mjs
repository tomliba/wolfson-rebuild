import { chromium } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

// Check URL (maybe we got redirected)
console.log('Current URL:', page.url());

// Check if skeleton is showing (means user state not loaded yet or not admin)
const skeleton = await page.locator('.animate-pulse').count();
console.log('Skeletons visible:', skeleton);

// Check if "פאנל ניהול" text is present
const adminTitle = await page.locator('text=פאנל ניהול').isVisible().catch(() => false);
console.log('Admin title visible:', adminTitle);

// Check full page HTML snippet
const headerHtml = await page.locator('body').evaluate(el => el.innerHTML.slice(0, 2000));
console.log('Page HTML (first 2000 chars):', headerHtml);

await browser.close();
