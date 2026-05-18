import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const DIR = path.join('tests', 'screenshots', 'echarts');
fs.mkdirSync(DIR, { recursive: true });

const EMAIL = 'tomliba1996@gmail.com';
const PASSWORD = 'Wolfson2026!';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Login
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('Logged in');

  // Go to admin
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Open report builder
  const reportBtn = page.locator('text=בניית דוח למצגת');
  await reportBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, '00-report-builder-open.png'), fullPage: false });
  console.log('Report builder opened');

  // Scroll to see all cards - take a full dialog screenshot
  const dialog = page.locator('[role="dialog"]');

  // Screenshot each card area
  // Card 1 - default donut
  await page.screenshot({ path: path.join(DIR, '01-card1-donut.png'), fullPage: false });

  // Scroll down to see more cards
  await dialog.evaluate(el => el.scrollTop = 400);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '02-card2-heatmap.png'), fullPage: false });

  await dialog.evaluate(el => el.scrollTop = 800);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '03-card3-bars.png'), fullPage: false });

  await dialog.evaluate(el => el.scrollTop = 1200);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '04-card4-donut.png'), fullPage: false });

  await dialog.evaluate(el => el.scrollTop = 1600);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '05-card5-bar.png'), fullPage: false });

  await dialog.evaluate(el => el.scrollTop = 2000);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(DIR, '06-card6-complications.png'), fullPage: false });

  // Now test chart mode switching
  // Scroll back to top
  await dialog.evaluate(el => el.scrollTop = 0);
  await page.waitForTimeout(500);

  // Card 1 - switch to bar
  const card1BarBtn = page.locator('button:has-text("בר")').first();
  if (await card1BarBtn.isVisible()) {
    await card1BarBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, '07-card1-bar.png'), fullPage: false });
    console.log('Card 1 bar mode');
  }

  // Card 1 - switch to dots
  const card1DotsBtn = page.locator('button:has-text("נקודות")').first();
  if (await card1DotsBtn.isVisible()) {
    await card1DotsBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, '08-card1-dots.png'), fullPage: false });
    console.log('Card 1 dots mode');
  }

  // Card 1 - back to donut
  const card1DonutBtn = page.locator('button:has-text("דונאט")').first();
  if (await card1DonutBtn.isVisible()) {
    await card1DonutBtn.click();
    await page.waitForTimeout(1000);
  }

  // Card 1 - toggle top 3
  const top3Btn1 = page.locator('button:has-text("3 מובילים")').first();
  if (await top3Btn1.isVisible()) {
    await top3Btn1.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, '09-card1-top3.png'), fullPage: false });
    console.log('Card 1 top3 mode');
    await top3Btn1.click(); // toggle back
    await page.waitForTimeout(500);
  }

  // Scroll to card 3 for heatmap mode
  await dialog.evaluate(el => el.scrollTop = 800);
  await page.waitForTimeout(500);
  const card3HeatmapBtn = page.locator('button:has-text("מפת חום")').first();
  if (await card3HeatmapBtn.isVisible()) {
    await card3HeatmapBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '10-card3-heatmap.png'), fullPage: false });
    console.log('Card 3 heatmap mode');
  }

  // Scroll to card 4 for bar and heatmap modes
  await dialog.evaluate(el => el.scrollTop = 1200);
  await page.waitForTimeout(500);

  // Card 4 - switch to bar
  // Need to find the bar button specifically in card 4 area
  const allBarBtns = page.locator('button:has-text("בר")');
  const barBtnCount = await allBarBtns.count();
  if (barBtnCount > 1) {
    await allBarBtns.nth(1).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, '11-card4-bar.png'), fullPage: false });
    console.log('Card 4 bar mode');
  }

  // Card 4 - heatmap
  const allHeatBtns = page.locator('button:has-text("מפת חום")');
  const heatBtnCount = await allHeatBtns.count();
  if (heatBtnCount > 1) {
    await allHeatBtns.nth(1).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(DIR, '12-card4-heatmap.png'), fullPage: false });
    console.log('Card 4 heatmap mode');
  }

  // Card 5 - switch to donut
  await dialog.evaluate(el => el.scrollTop = 1600);
  await page.waitForTimeout(500);
  const card5DonutBtn = page.locator('button:has-text("דונאט")');
  const donutCount = await card5DonutBtn.count();
  if (donutCount > 0) {
    await card5DonutBtn.last().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DIR, '13-card5-donut.png'), fullPage: false });
    console.log('Card 5 donut mode');
  }

  // Test downloads - select all cards first
  await dialog.evaluate(el => el.scrollTop = 0);
  await page.waitForTimeout(500);

  // Check all card checkboxes
  const checkboxes = page.locator('[role="dialog"] input[type="checkbox"], [role="dialog"] [role="checkbox"]');
  const checkCount = await checkboxes.count();
  console.log(`Found ${checkCount} checkboxes`);
  for (let i = 0; i < checkCount; i++) {
    const cb = checkboxes.nth(i);
    const checked = await cb.isChecked().catch(() => false);
    if (!checked) {
      await cb.click().catch(() => {});
    }
  }
  await page.waitForTimeout(500);

  // Test image download
  const downloadImgBtn = page.locator('button:has-text("הורד תמונות")');
  if (await downloadImgBtn.isVisible()) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      downloadImgBtn.click(),
    ]);
    if (download) {
      const suggestedName = download.suggestedFilename();
      console.log(`Image download: ${suggestedName}`);
      await download.saveAs(path.join(DIR, `download-${suggestedName}`));
    } else {
      console.log('No download event for images');
    }
    await page.waitForTimeout(2000);
  }

  // Test PPTX download
  const downloadPptxBtn = page.locator('button:has-text("הורד מצגת")');
  if (await downloadPptxBtn.isVisible()) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      downloadPptxBtn.click(),
    ]);
    if (download) {
      const suggestedName = download.suggestedFilename();
      console.log(`PPTX download: ${suggestedName}`);
      await download.saveAs(path.join(DIR, `download-${suggestedName}`));
    } else {
      console.log('No download event for PPTX');
    }
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: path.join(DIR, '14-final-state.png'), fullPage: false });

  await browser.close();
  console.log('Done! Screenshots saved to', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
