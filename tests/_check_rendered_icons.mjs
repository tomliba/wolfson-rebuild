import { chromium } from '@playwright/test';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });

// Load auth state
const authState = JSON.parse(fs.readFileSync('./tests/auth-state.json', 'utf8'));
const context = await browser.newContext({ baseURL: 'http://localhost:3000', storageState: authState });
const page = await context.newPage();

// Check tasks page for Circle/CheckCircle icons
await page.goto('/tasks');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

const svgs = await page.locator('svg').evaluateAll(els =>
  els.map(el => ({ classes: el.className.baseVal, tag: el.tagName })).slice(0, 20)
);
console.log('SVGs on /tasks page:');
svgs.forEach(s => console.log(' ', s.classes));

// Check surgeries page for Pencil/Trash icons
await page.goto('/surgeries');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

const svgs2 = await page.locator('svg').evaluateAll(els =>
  els.map(el => ({ classes: el.className.baseVal })).slice(0, 30)
);
console.log('\nSVGs on /surgeries page:');
svgs2.forEach(s => console.log(' ', s.classes));

// Check mobile header for Menu icon
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

const svgs3 = await page.locator('header svg').evaluateAll(els =>
  els.map(el => ({ classes: el.className.baseVal }))
);
console.log('\nSVGs in header (mobile):');
svgs3.forEach(s => console.log(' ', s.classes));

await browser.close();
