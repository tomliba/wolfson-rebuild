import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_STATE = path.join(process.cwd(), 'tests', 'auth-state.json');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'downloads');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const DOWNLOAD_DIR = path.join(process.cwd(), 'tests', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

let passed = 0;
let failed = 0;
const pageErrors = [];
function check(label, condition) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.log(`  FAIL: ${label}`); }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: AUTH_STATE, acceptDownloads: true });
const page = await context.newPage();
page.on('pageerror', e => pageErrors.push(e.message));

try {
  // 1. Go to admin
  console.log('1. Navigate to admin');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('text=פאנל ניהול', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 2. Open report builder
  console.log('2. Open report builder');
  await page.locator('button', { hasText: 'בניית דוח למצגת' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-report-builder-open.png'), fullPage: true });

  // 3. Verify buttons are enabled (all 6 charts selected by default)
  console.log('3. Check buttons are enabled');
  const imgBtn = page.locator('button', { hasText: 'הורד תמונות' });
  const pptxBtn = page.locator('button', { hasText: 'הורד מצגת' });
  check('Image button visible', await imgBtn.isVisible());
  check('PPTX button visible', await pptxBtn.isVisible());
  const imgDisabled = await imgBtn.getAttribute('disabled');
  const pptxDisabled = await pptxBtn.getAttribute('disabled');
  check('Image button enabled', imgDisabled === null);
  check('PPTX button enabled', pptxDisabled === null);

  // 4. Test PPTX download
  console.log('4. Test PPTX download');
  const [pptxDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    pptxBtn.click(),
  ]);
  const pptxPath = path.join(DOWNLOAD_DIR, pptxDownload.suggestedFilename());
  await pptxDownload.saveAs(pptxPath);
  check('PPTX file downloaded', fs.existsSync(pptxPath));
  const pptxSize = fs.statSync(pptxPath).size;
  console.log(`   PPTX file: ${pptxDownload.suggestedFilename()} (${pptxSize} bytes)`);
  check('PPTX file has content', pptxSize > 1000);

  // Wait for button to re-enable
  await page.waitForTimeout(2000);

  // 5. Test image download (with all 6 selected, should be a ZIP)
  console.log('5. Test image download (ZIP)');
  const [imgDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    imgBtn.click(),
  ]);
  const imgPath = path.join(DOWNLOAD_DIR, imgDownload.suggestedFilename());
  await imgDownload.saveAs(imgPath);
  check('Image file downloaded', fs.existsSync(imgPath));
  const imgSize = fs.statSync(imgPath).size;
  console.log(`   Image file: ${imgDownload.suggestedFilename()} (${imgSize} bytes)`);
  check('Image file has content', imgSize > 1000);
  check('Image file is ZIP (multiple charts)', imgDownload.suggestedFilename().endsWith('.zip'));

  // Wait for button to re-enable
  await page.waitForTimeout(2000);

  // 6. Uncheck all but one chart, test single PNG download
  console.log('6. Test single image download');
  // Uncheck cards 2-6 (keep only card 1)
  const checkboxes = page.locator('[role="checkbox"]');
  const checkboxCount = await checkboxes.count();
  console.log(`   Found ${checkboxCount} checkboxes`);
  // Click checkboxes 2-6 (indices 1-5) to uncheck them
  for (let i = 1; i < checkboxCount; i++) {
    await checkboxes.nth(i).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);

  // Verify count shows 1
  check('1 chart selected', await page.locator('text=1 תרשימים נבחרו').isVisible());

  const [singleDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    imgBtn.click(),
  ]);
  const singlePath = path.join(DOWNLOAD_DIR, singleDownload.suggestedFilename());
  await singleDownload.saveAs(singlePath);
  check('Single PNG downloaded', fs.existsSync(singlePath));
  console.log(`   Single file: ${singleDownload.suggestedFilename()}`);
  check('Single file is PNG', singleDownload.suggestedFilename().endsWith('.png'));

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-after-downloads.png'), fullPage: true });

  check('Zero page errors', pageErrors.length === 0);

} catch (err) {
  failed++;
  console.log('CAUGHT ERROR:', err.message);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99-error.png'), fullPage: true }).catch(() => {});
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (pageErrors.length > 0) pageErrors.forEach(e => console.log('  PAGE ERROR:', e.slice(0, 300)));
await browser.close();
