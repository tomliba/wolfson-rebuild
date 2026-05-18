import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

const DIR = path.join('tests', 'screenshots', 'excel-export');
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

  // Go to admin panel
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Click export button
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.locator('button:has-text("ייצוא לאקסל")').click(),
  ]);

  const suggestedName = download.suggestedFilename();
  const savePath = path.join(DIR, suggestedName);
  await download.saveAs(savePath);
  console.log(`Downloaded: ${suggestedName}`);

  // Read and analyze the Excel file
  const wb = XLSX.readFile(savePath);
  console.log(`\nSheets: ${wb.SheetNames.join(', ')}`);

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n--- ${name} (${data.length} rows) ---`);

    if (name === 'כל הניתוחים') {
      const residents = [...new Set(data.map(r => r['מתמחה']))];
      console.log(`  Residents with surgeries: ${residents.length}`);
      residents.forEach(r => {
        const count = data.filter(d => d['מתמחה'] === r).length;
        console.log(`    ${r}: ${count} surgeries`);
      });
    } else if (name === 'סרטי ניתוחים') {
      const residents = [...new Set(data.map(r => r['מתמחה']))];
      console.log(`  Residents with videos: ${residents.length}`);
    } else if (name === 'מטלות') {
      const residents = [...new Set(data.map(r => r['מתמחה']))];
      console.log(`  Residents with completions: ${residents.length}`);
    } else if (name === 'סיכום ניתוחים') {
      data.forEach(r => console.log(`  ${r['מתמחה']}: total=${r['סה"כ']}`));
    } else if (data.length <= 15) {
      data.forEach(r => console.log(`  ${JSON.stringify(r).substring(0, 100)}`));
    } else {
      console.log(`  (first 3 rows)`);
      data.slice(0, 3).forEach(r => console.log(`  ${JSON.stringify(r).substring(0, 100)}`));
    }
  }

  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
