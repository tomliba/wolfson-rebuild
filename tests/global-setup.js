import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AUTH_STATE_PATH = path.join(process.cwd(), 'tests', 'auth-state.json');

export default async function globalSetup() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.local. ' +
      'Add both to run tests.'
    );
  }

  // Always do a fresh login
  if (fs.existsSync(AUTH_STATE_PATH)) {
    fs.unlinkSync(AUTH_STATE_PATH);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: Navigate to login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  // Step 2: Fill email
  const emailInput = page.locator('input[name="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);

  // Step 3: Fill password
  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);

  // Step 4: Click sign in
  const signInButton = page.locator('button[type="submit"]');
  await signInButton.click();

  // Step 5: Wait for navigation to dashboard
  try {
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
  } catch (e) {
    const currentUrl = page.url();
    const bodyText = await page.textContent('body').catch(() => '');
    throw new Error(
      `Login failed. Still at ${currentUrl}. ` +
      `Page text: ${bodyText.slice(0, 200)}`
    );
  }

  // Step 6: Wait for page to settle
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Step 7: Save auth state
  await context.storageState({ path: AUTH_STATE_PATH });
  console.log('[global-setup] Auth state saved successfully.');

  await browser.close();
}
