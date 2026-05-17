import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE });
const page = await context.newPage();

await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

// Evaluate in-browser to fetch raw task data from Supabase
const taskData = await page.evaluate(async () => {
  try {
    // Access the supabase client that's already initialized on the page
    const res = await fetch('/api/debug-tasks').catch(() => null);
    // Alternatively, just check what react-query has cached
    return 'check screenshot for data';
  } catch (e) {
    return e.message;
  }
});

// Try to get task data from the page's react-query cache
const cachedData = await page.evaluate(() => {
  // Look for react query devtools or internal cache
  const root = document.getElementById('__next');
  // Check if there's task data in any script tag
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const s of scripts) {
    if (s.textContent?.includes('one_time_tasks') || s.textContent?.includes('task_name')) {
      return s.textContent.slice(0, 500);
    }
  }
  return 'no task data in scripts';
});

console.log('Cached data check:', cachedData);

// Get the full page HTML to see if descriptions are in the DOM
const taskElements = await page.evaluate(() => {
  const cards = document.querySelectorAll('.space-y-3 [class*="Card"], .space-y-3 > div > div');
  return Array.from(cards).map(card => ({
    text: card.textContent?.trim(),
    html: card.innerHTML?.slice(0, 300)
  }));
});

console.log('Task elements:', JSON.stringify(taskElements, null, 2));

await browser.close();
