import { test } from '@playwright/test';
import path from 'path';

const webDir = path.join(process.cwd(), 'tests', 'comparison', 'web');
const mobileDir = path.join(process.cwd(), 'tests', 'comparison', 'mobile');

// Web screenshots at 1920x1080
test.describe('Web visual capture', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(webDir, 'Dashboard.png'), fullPage: true });
  });

  test('Dashboard scrolled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Dashboard-2.png'), fullPage: true });
  });

  test('Tasks page', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(webDir, 'Tasks-page.png'), fullPage: true });
  });

  test('Tasks page 2', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Tasks-page-2.png'), fullPage: true });
  });

  test('Tasks page 3', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Tasks-page-3.png'), fullPage: true });
  });

  test('Surgeries page', async ({ page }) => {
    await page.goto('/surgeries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(webDir, 'Surgeries-page.png'), fullPage: true });
  });

  test('Surgeries form open', async ({ page }) => {
    await page.goto('/surgeries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Surgeries-form-open.png'), fullPage: true });
  });

  test('Surgeries form open scrolled', async ({ page }) => {
    await page.goto('/surgeries');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ניתוח חדש' }).click();
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Surgeries-form-open-2.png'), fullPage: true });
  });

  test('Videos page', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(webDir, 'Videos-page.png'), fullPage: true });
  });

  test('Videos page 2', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(webDir, 'Videos-page-2.png'), fullPage: true });
  });

  test('AdminPanel', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(webDir, 'AdminPanel.png'), fullPage: true });
  });
});

// Mobile screenshots at 390x844
test.describe('Mobile visual capture', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Tasks page mobile', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(mobileDir, 'Tasks-page-3.png'), fullPage: true });
  });
});
