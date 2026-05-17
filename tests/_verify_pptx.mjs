import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const DOWNLOAD_DIR = path.join(process.cwd(), 'tests', 'downloads');

// Check PPTX (it's a ZIP file internally)
const pptxFiles = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.pptx'));
if (pptxFiles.length === 0) {
  console.log('No PPTX files found');
  process.exit(1);
}

const pptxPath = path.join(DOWNLOAD_DIR, pptxFiles[0]);
console.log('Checking:', pptxFiles[0]);

const data = fs.readFileSync(pptxPath);
const zip = await JSZip.loadAsync(data);

// Count slides
const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/));
console.log(`Slides found: ${slideFiles.length} (expected 7: 1 title + 6 charts)`);

// Check each slide for content
for (const slideFile of slideFiles.sort()) {
  const content = await zip.files[slideFile].async('string');
  const slideNum = slideFile.match(/slide(\d+)/)[1];

  const hasChart = content.includes('c:chart') || content.includes('c:doughnut') || content.includes('c:bar');
  const hasTable = content.includes('a:tbl');
  const hasImage = content.includes('r:embed');

  let type = 'text-only';
  if (hasChart) type = 'native chart';
  if (hasTable) type = 'native table';
  if (hasImage && !hasChart) type = 'image';

  console.log(`  Slide ${slideNum}: ${type}`);
}

// Check ZIP file
const zipFiles = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.zip'));
if (zipFiles.length > 0) {
  const zipPath = path.join(DOWNLOAD_DIR, zipFiles[0]);
  const zipData = fs.readFileSync(zipPath);
  const imgZip = await JSZip.loadAsync(zipData);
  const pngFiles = Object.keys(imgZip.files).filter(f => f.endsWith('.png'));
  console.log(`\nZIP file contains ${pngFiles.length} PNG files:`);
  pngFiles.forEach(f => {
    const size = imgZip.files[f]._data?.uncompressedSize || 'unknown';
    console.log(`  ${f}`);
  });
}

// Check single PNG
const pngFiles = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.png'));
if (pngFiles.length > 0) {
  console.log(`\nSingle PNG files:`);
  pngFiles.forEach(f => {
    const size = fs.statSync(path.join(DOWNLOAD_DIR, f)).size;
    console.log(`  ${f} (${size} bytes)`);
  });
}
