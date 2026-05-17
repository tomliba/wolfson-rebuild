import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const DIR = path.join(process.cwd(), 'tests', 'screenshots', 'card-inspect');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE, viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 });
await page.waitForTimeout(2000);

await page.locator('button', { hasText: 'בניית דוח למצגת' }).click();
await page.waitForTimeout(3000);

const dialog = page.locator('[role="dialog"]');

// Screenshot each card individually by scrolling to it and clipping
const cards = await dialog.locator('.space-y-3').all();
console.log(`Found ${cards.length} card containers`);

// Get all Card elements inside the dialog
const allCards = await dialog.locator('[class*="rounded-xl"], [class*="border"]').all();

// Instead, let's find cards by their title text
const cardTitles = [
  'כמה ניתוחים לכל מתמחה?',
  'מתי כל מתמחה ניתח?',
  'לאיזה שלב כל מתמחה הגיע?',
  'איזה מפקח פיקח על מי?',
  'כמה ניתוחים פיקח כל מנתח החודש?',
  'מה שיעור הסיבוכים?',
];

for (let i = 0; i < cardTitles.length; i++) {
  const title = cardTitles[i];
  const cardTitle = dialog.locator(`text=${title}`);
  const exists = await cardTitle.count();
  if (exists === 0) {
    console.log(`Card ${i + 1}: "${title}" not found`);
    continue;
  }

  // Scroll the title into view
  await cardTitle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Find the parent card element
  const card = cardTitle.locator('xpath=ancestor::div[contains(@class,"rounded")]').last();
  const box = await card.boundingBox().catch(() => null);
  if (box) {
    await page.screenshot({
      path: path.join(DIR, `card-${i + 1}.png`),
      clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: box.width + 20, height: box.height + 20 }
    });
    console.log(`Card ${i + 1}: captured (${Math.round(box.width)}x${Math.round(box.height)})`);
  } else {
    console.log(`Card ${i + 1}: no bounding box`);
  }
}

await browser.close();
console.log('Done. Screenshots in tests/screenshots/card-inspect/');
