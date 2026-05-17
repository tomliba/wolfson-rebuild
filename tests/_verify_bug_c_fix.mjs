import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'bug-c-fix');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const expected = [
  { name: 'הכרת המיקרוסקופ', desc: 'הכרות עם תפעול המיקרוסקופ הניתוחי' },
  { name: 'הכרת מכשיר פאקו', desc: 'הכרות עם תפעול מכשיר הפאקואמולסיפיקציה' },
  { name: 'הכרת כלי הניתוח', desc: 'הכרות עם כלי הניתוח השונים וייעודם' },
  { name: 'קריאת ספר פאקו', desc: 'קריאת חומר תיאורטי על ניתוח פאקו' },
  { name: 'תרגול בעיניים מלאכותיות', desc: 'תרגול מעשי על עיניים מלאכותיות (Wet Lab)' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tasks-page.png'), fullPage: true });

// Count tasks
const taskNames = page.locator('h3');
const count = await taskNames.count();
check(`Found ${count} tasks (expected 5)`, count === 5);

// Verify each task name and description
for (let i = 0; i < Math.min(count, 5); i++) {
  const name = (await taskNames.nth(i).textContent()).trim();
  const parent = taskNames.nth(i).locator('..');
  const descEl = parent.locator('p.text-muted-foreground').first();
  const desc = await descEl.textContent().catch(() => 'MISSING');

  const exp = expected[i];
  check(`Task ${i + 1} name: "${name}" matches "${exp.name}"`, name === exp.name);
  check(`Task ${i + 1} desc: "${desc}" matches "${exp.desc}"`, desc.trim() === exp.desc);
}

// Check header
const subHeader = await page.locator('p.text-muted-foreground').first().textContent();
console.log(`\nHeader: ${subHeader?.trim()}`);

console.log(`\nResults: ${passed} passed, ${failed} failed`);

await browser.close();
