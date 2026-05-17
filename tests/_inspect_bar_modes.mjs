import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const DIR = path.join(process.cwd(), 'tests', 'screenshots', 'card-inspect');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE, viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 });
await page.waitForTimeout(2000);
await page.locator('button', { hasText: 'בניית דוח למצגת' }).click();
await page.waitForTimeout(3000);

// Switch card 1 to bar mode
await page.locator('button', { hasText: 'עמודות' }).first().click();
await page.waitForTimeout(1000);

// Screenshot card 1 in bar mode
const card1Title = page.locator('text=כמה ניתוחים לכל מתמחה?');
await card1Title.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const card1 = card1Title.locator('xpath=ancestor::div[contains(@class,"rounded")]').last();
const box1 = await card1.boundingBox();
if (box1) {
  await page.screenshot({ path: path.join(DIR, 'card-1-bar.png'), clip: { x: box1.x - 10, y: box1.y - 10, width: box1.width + 20, height: box1.height + 20 } });
  console.log('Card 1 bar mode captured');
}

// Switch card 4 to bar mode
const card4Buttons = page.locator('text=עמודות');
await card4Buttons.nth(1).click();
await page.waitForTimeout(1000);

const card4Title = page.locator('text=איזה מפקח פיקח על מי?');
await card4Title.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const card4 = card4Title.locator('xpath=ancestor::div[contains(@class,"rounded")]').last();
const box4 = await card4.boundingBox();
if (box4) {
  await page.screenshot({ path: path.join(DIR, 'card-4-bar.png'), clip: { x: box4.x - 10, y: box4.y - 10, width: box4.width + 20, height: box4.height + 20 } });
  console.log('Card 4 bar mode captured');
}

await browser.close();
