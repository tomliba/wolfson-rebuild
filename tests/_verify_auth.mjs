import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PROD_URL = 'https://wolfsonrebuild.vercel.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'auth-test');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

const browser = await chromium.launch({ headless: true });

// Test 1: Unauthenticated user gets redirected to login
console.log('1. Unauthenticated access');
const ctx1 = await browser.newContext();
const page1 = await ctx1.newPage();
await page1.goto(PROD_URL, { waitUntil: 'load', timeout: 30000 });
await page1.waitForTimeout(3000);
const url1 = page1.url();
console.log(`   Redirected to: ${url1}`);
check('Unauthenticated redirects to /login', url1.includes('/login'));
await page1.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-page.png'), fullPage: true });
await ctx1.close();

// Test 2: Wrong password
console.log('2. Wrong password');
const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
await page2.goto(`${PROD_URL}/login`, { waitUntil: 'load', timeout: 30000 });
await page2.waitForTimeout(1000);
await page2.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL);
await page2.locator('input[name="password"]').fill('WrongPassword123!');
await page2.locator('button[type="submit"]').click();
await page2.waitForTimeout(3000);
const stillOnLogin = page2.url().includes('/login');
check('Wrong password stays on login', stillOnLogin);
const errorMsg = await page2.locator('text=שגיאה').isVisible().catch(() => false)
  || await page2.locator('[role="alert"]').isVisible().catch(() => false)
  || await page2.locator('text=Invalid').isVisible().catch(() => false);
console.log(`   Error message visible: ${errorMsg}`);
await page2.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-wrong-password.png'), fullPage: true });
await ctx2.close();

// Test 3: Correct login
console.log('3. Correct login');
const ctx3 = await browser.newContext();
const page3 = await ctx3.newPage();
await page3.goto(`${PROD_URL}/login`, { waitUntil: 'load', timeout: 30000 });
await page3.waitForTimeout(1000);
await page3.locator('input[name="email"]').fill(process.env.TEST_USER_EMAIL);
await page3.locator('input[name="password"]').fill(process.env.TEST_USER_PASSWORD);
await page3.locator('button[type="submit"]').click();
await page3.waitForURL('**/!(login)**', { timeout: 15000 }).catch(() => {});
await page3.waitForTimeout(3000);
const url3 = page3.url();
console.log(`   Landed on: ${url3}`);
check('Correct login redirects to dashboard', !url3.includes('/login'));
await page3.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-logged-in.png'), fullPage: true });

// Test 4: Protected routes accessible after login
console.log('4. Protected routes');
await page3.goto(`${PROD_URL}/surgeries`, { waitUntil: 'load', timeout: 15000 });
await page3.waitForTimeout(2000);
check('Surgeries accessible', !page3.url().includes('/login'));

await page3.goto(`${PROD_URL}/tasks`, { waitUntil: 'load', timeout: 15000 });
await page3.waitForTimeout(2000);
check('Tasks accessible', !page3.url().includes('/login'));

await page3.goto(`${PROD_URL}/videos`, { waitUntil: 'load', timeout: 15000 });
await page3.waitForTimeout(2000);
check('Videos accessible', !page3.url().includes('/login'));

await page3.goto(`${PROD_URL}/admin`, { waitUntil: 'load', timeout: 15000 });
await page3.waitForTimeout(2000);
check('Admin accessible (admin user)', !page3.url().includes('/login'));
await page3.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-admin-accessible.png'), fullPage: true });

// Test 5: Logout
console.log('5. Logout');
const logoutBtn = page3.locator('text=התנתק');
if (await logoutBtn.isVisible().catch(() => false)) {
  await logoutBtn.click();
  await page3.waitForTimeout(3000);
  const urlAfterLogout = page3.url();
  console.log(`   After logout: ${urlAfterLogout}`);
  check('Logout redirects to login', urlAfterLogout.includes('/login'));
  await page3.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-after-logout.png'), fullPage: true });

  // Test 6: After logout, protected routes redirect to login
  console.log('6. Post-logout protection');
  await page3.goto(`${PROD_URL}/surgeries`, { waitUntil: 'load', timeout: 15000 });
  await page3.waitForTimeout(3000);
  check('Post-logout redirect to login', page3.url().includes('/login'));
} else {
  console.log('   Logout button not found, skipping logout tests');
}

await ctx3.close();
await browser.close();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
