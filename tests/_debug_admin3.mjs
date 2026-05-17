import { chromium } from '@playwright/test';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(5000);

// Search for "מצגת" anywhere in the page
const hasMatzget = await page.locator('text=מצגת').count();
console.log('Elements containing מצגת:', hasMatzget);

// Search for "ייצוא" anywhere
const hasExport = await page.locator('text=ייצוא').count();
console.log('Elements containing ייצוא:', hasExport);

// Search for FileText icon or Download icon
const hasFileText = await page.locator('text=בניית דוח').count();
console.log('Elements containing בניית דוח:', hasFileText);

// Check all buttons more carefully
const allBtns = await page.locator('button').all();
console.log('Total button elements:', allBtns.length);
for (let i = 0; i < allBtns.length; i++) {
  const txt = await allBtns[i].textContent();
  const vis = await allBtns[i].isVisible();
  console.log(`  Button ${i}: "${txt.trim().slice(0, 50)}" visible=${vis}`);
}

// Check if the select dropdowns (month/year) exist
const selects = await page.locator('[role="combobox"]').count();
console.log('Combobox/Select elements:', selects);

// Check the header flex area
const header = await page.locator('.flex.flex-wrap.items-center.justify-between').first();
const headerVisible = await header.isVisible().catch(() => false);
console.log('Header flex area visible:', headerVisible);
if (headerVisible) {
  const headerHtml = await header.innerHTML();
  console.log('Header HTML length:', headerHtml.length);
  console.log('Header HTML (first 500):', headerHtml.slice(0, 500));
}

await browser.close();
