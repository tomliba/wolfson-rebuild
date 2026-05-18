'use client';

import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

const MONTHS_HE_FULL = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const MONTHS_HE = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];
const COLORS = ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc','#5c7bd9','#6dce89','#f7b74a','#ef8181','#8fd4e8'];
const GREEN_COLORS = ['#1D9E75','#0F6E56','#5DCAA5','#9FE1CB','#3ba272','#085041'];
const COMP_COLORS = ['#1D9E75', '#E24B4A'];

function cellColorHex(count) {
  if (count === 0) return 'E5E7EB';
  if (count <= 3) return 'B5D4F4';
  if (count <= 6) return '378ADD';
  return '185FA5';
}

function cellTextColor(count) {
  if (count === 0) return '9CA3AF';
  if (count <= 3) return '1E3A5F';
  return 'FFFFFF';
}

const CARD_TITLES = {
  1: 'כמה ניתוחים לכל מתמחה?',
  2: 'מתי כל מתמחה ניתח?',
  3: 'לאיזה שלב כל מתמחה הגיע?',
  4: 'איזה מפקח פיקח על מי?',
  5: 'כמה ניתוחים פיקח כל מנתח החודש?',
  6: 'מה שיעור הסיבוכים?',
};

const FILE_NAMES = {
  1: 'chart_1_surgeries_per_resident',
  2: 'chart_2_monthly_heatmap',
  3: 'chart_3_stage_progression',
  4: 'chart_4_attending_residents',
  5: 'chart_5_attending_monthly',
  6: 'chart_6_complications',
};

function computeChartData(cardId, { surgeries, residents, selectedMonth, selectedYear, chartTypes, showTop3 }) {
  const filterByMonth = (s) => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  };

  if (cardId === 1) {
    const filtered = surgeries.filter(filterByMonth);
    let data = residents.map(r => ({
      name: r.full_name || r.email,
      value: filtered.filter(s => s.resident_email === r.email).length,
    })).sort((a, b) => b.value - a.value);
    if (showTop3[1] && data.length > 3) {
      const top3 = data.slice(0, 3);
      const rest = data.slice(3).reduce((sum, d) => sum + d.value, 0);
      data = [...top3, { name: 'אחרים', value: rest }];
    }
    return { type: chartTypes[1] || 'donut', data };
  }

  if (cardId === 2) {
    const sortedResidents = [...residents].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email, 'he'));
    const rows = sortedResidents.map(r => {
      const monthly = MONTHS_HE.map((_, i) => surgeries.filter(s => { if (s.resident_email !== r.email || !s.surgery_date) return false; const d = new Date(s.surgery_date); return d.getMonth() === i && d.getFullYear() === selectedYear; }).length);
      return { name: r.full_name || r.email, monthly, total: monthly.reduce((a, b) => a + b, 0) };
    });
    return { type: 'heatmap', rows, headers: MONTHS_HE };
  }

  if (cardId === 3) {
    const data = residents.map(r => {
      const rs = surgeries.filter(s => s.resident_email === r.email);
      const stepCounts = {};
      SURGERY_STEPS.forEach(step => { stepCounts[step.id] = rs.filter(s => s.steps_performed?.includes(step.id)).length; });
      return { name: r.full_name || r.email, stepCounts };
    });
    return { type: chartTypes[3] === 'heatmap' ? 'heatmap_steps' : 'bars_steps', data };
  }

  if (cardId === 4) {
    const filtered = surgeries.filter(filterByMonth);
    const supervisors = [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))];
    if (chartTypes[4] === 'heatmap') {
      const sortedSups = [...supervisors].sort();
      const rows = sortedSups.map(sup => ({
        name: sup,
        cells: residents.map(r => filtered.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length),
        total: filtered.filter(s => s.supervising_surgeon === sup).length,
      }));
      return { type: 'heatmap_attending', rows, residentNames: residents.map(r => r.full_name || r.email) };
    }
    let donutData = supervisors.map(sup => ({ name: sup, value: filtered.filter(s => s.supervising_surgeon === sup).length })).sort((a, b) => b.value - a.value);
    if (showTop3[4] && donutData.length > 3) {
      const top3 = donutData.slice(0, 3);
      const rest = donutData.slice(3).reduce((sum, d) => sum + d.value, 0);
      donutData = [...top3, { name: 'אחרים', value: rest }];
    }
    return { type: chartTypes[4] || 'donut', data: donutData };
  }

  if (cardId === 5) {
    const filtered = surgeries.filter(filterByMonth);
    const supervisors = [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))];
    const data = supervisors.map(sup => ({ name: sup, value: filtered.filter(s => s.supervising_surgeon === sup).length })).sort((a, b) => b.value - a.value);
    return { type: chartTypes[5] || 'bar', data };
  }

  if (cardId === 6) {
    const filtered = surgeries.filter(filterByMonth);
    const withComps = filtered.filter(s => s.complications && s.complications.length > 0).length;
    return { type: 'donut', data: [{ name: 'ללא סיבוכים', value: filtered.length - withComps }, { name: 'עם סיבוכים', value: withComps }], colors: COMP_COLORS };
  }
}

async function getRefImage(ref) {
  const refObj = ref?.current;
  if (!refObj) return null;

  if (refObj.getDataURL) {
    const url = refObj.getDataURL();
    if (url) return url;
  }

  const el = refObj.isHTML ? refObj.el : ref.current;
  if (!el) return null;
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
  return canvas.toDataURL('image/png');
}

async function getRefBlob(ref) {
  const base64 = await getRefImage(ref);
  if (!base64) return null;
  const res = await fetch(base64);
  return res.blob();
}

function addPptxTable(slide, cardId, computed, subtitle) {
  slide.addText(CARD_TITLES[cardId], { x: 0.3, y: 0.2, w: 9.4, h: 0.5, fontSize: 20, fontFace: 'Arial', color: '1a1a1a', align: 'right', rtlMode: true, bold: true });
  slide.addText(subtitle, { x: 0.3, y: 0.65, w: 9.4, h: 0.3, fontSize: 12, fontFace: 'Arial', color: '666666', align: 'right', rtlMode: true });

  if (computed.type === 'heatmap') {
    const headerRow = [{ text: 'מתמחה', options: { bold: true, fontSize: 8, align: 'right', fill: 'F0F0F0' } }];
    computed.headers.forEach(h => headerRow.push({ text: h, options: { bold: true, fontSize: 7, align: 'center', fill: 'F0F0F0' } }));
    headerRow.push({ text: 'סה"כ', options: { bold: true, fontSize: 8, align: 'center', fill: 'F0F0F0' } });
    const tableRows = [headerRow];
    computed.rows.forEach(r => {
      const row = [{ text: r.name, options: { fontSize: 8, align: 'right' } }];
      r.monthly.forEach(count => row.push({ text: String(count), options: { fontSize: 8, align: 'center', bold: true, fill: cellColorHex(count), color: cellTextColor(count) } }));
      row.push({ text: String(r.total), options: { fontSize: 8, align: 'center', bold: true, fill: 'F0F0F0' } });
      tableRows.push(row);
    });
    slide.addTable(tableRows, { x: 0.3, y: 1.1, w: 9.4, border: { pt: 0.5, color: 'CCCCCC' }, fontFace: 'Arial', rowH: 0.3 });
    return;
  }

  if (computed.type === 'heatmap_steps') {
    const headerRow = [{ text: 'מתמחה', options: { bold: true, fontSize: 7, align: 'right', fill: 'F0F0F0' } }];
    SURGERY_STEPS.forEach(step => headerRow.push({ text: step.label, options: { bold: true, fontSize: 6, align: 'center', fill: 'F0F0F0' } }));
    const tableRows = [headerRow];
    computed.data.forEach(r => {
      const row = [{ text: r.name, options: { fontSize: 7, align: 'right' } }];
      SURGERY_STEPS.forEach(step => { const c = r.stepCounts[step.id]; row.push({ text: String(c), options: { fontSize: 7, align: 'center', bold: true, fill: cellColorHex(c), color: cellTextColor(c) } }); });
      tableRows.push(row);
    });
    slide.addTable(tableRows, { x: 0.3, y: 1.1, w: 9.4, border: { pt: 0.5, color: 'CCCCCC' }, fontFace: 'Arial', rowH: 0.3 });
    return;
  }

  if (computed.type === 'heatmap_attending') {
    const headerRow = [{ text: 'מנתח מפקח', options: { bold: true, fontSize: 7, align: 'right', fill: 'F0F0F0' } }];
    computed.residentNames.forEach(name => headerRow.push({ text: name, options: { bold: true, fontSize: 6, align: 'center', fill: 'F0F0F0' } }));
    headerRow.push({ text: 'סה"כ', options: { bold: true, fontSize: 7, align: 'center', fill: 'F0F0F0' } });
    const tableRows = [headerRow];
    computed.rows.forEach(r => {
      const row = [{ text: r.name, options: { fontSize: 7, align: 'right' } }];
      r.cells.forEach(count => row.push({ text: String(count), options: { fontSize: 7, align: 'center', bold: true, fill: cellColorHex(count), color: cellTextColor(count) } }));
      row.push({ text: String(r.total), options: { fontSize: 7, align: 'center', bold: true, fill: 'F0F0F0' } });
      tableRows.push(row);
    });
    slide.addTable(tableRows, { x: 0.3, y: 1.1, w: 9.4, border: { pt: 0.5, color: 'CCCCCC' }, fontFace: 'Arial', rowH: 0.3 });
    return;
  }
}

function isTableType(cardId, chartTypes) {
  if (cardId === 2) return true;
  if (cardId === 3 && chartTypes[3] === 'heatmap') return true;
  if (cardId === 4 && chartTypes[4] === 'heatmap') return true;
  return false;
}

export async function downloadPptx({ selected, chartTypes, showTop3, refs, surgeries, residents, selectedMonth, selectedYear }) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.rtlMode = true;

  const subtitle = `${MONTHS_HE_FULL[selectedMonth]} ${selectedYear}`;

  const titleSlide = pptx.addSlide();
  titleSlide.addText('דוח הכשרת קטרקט', { x: 0.5, y: 1.5, w: 9, h: 1.2, fontSize: 36, fontFace: 'Arial', color: '1a1a1a', align: 'center', bold: true, rtlMode: true });
  titleSlide.addText(subtitle, { x: 0.5, y: 2.8, w: 9, h: 0.6, fontSize: 18, fontFace: 'Arial', color: '666666', align: 'center', rtlMode: true });
  titleSlide.addText('בית חולים וולפסון', { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 14, fontFace: 'Arial', color: '999999', align: 'center', rtlMode: true });

  const selectedIds = Object.entries(selected).filter(([_, v]) => v).map(([k]) => parseInt(k)).sort();

  for (const cardId of selectedIds) {
    const slide = pptx.addSlide();
    const computed = computeChartData(cardId, { surgeries, residents, selectedMonth, selectedYear, chartTypes, showTop3 });

    slide.addText(CARD_TITLES[cardId], { x: 0.3, y: 0.2, w: 9.4, h: 0.5, fontSize: 20, fontFace: 'Arial', color: '1a1a1a', align: 'right', rtlMode: true, bold: true });
    slide.addText(subtitle, { x: 0.3, y: 0.65, w: 9.4, h: 0.3, fontSize: 12, fontFace: 'Arial', color: '666666', align: 'right', rtlMode: true });

    if (isTableType(cardId, chartTypes)) {
      addPptxTable(slide, cardId, computed, subtitle);
    } else {
      const base64 = await getRefImage(refs[cardId]);
      if (base64) {
        slide.addImage({ data: base64, x: 0.5, y: 1.1, w: 9, h: 4.2, sizing: { type: 'contain', w: 9, h: 4.2 } });
      }
    }
  }

  const fileName = `דוח_קטרקט_${MONTHS_HE_FULL[selectedMonth]}_${selectedYear}.pptx`;
  await pptx.writeFile({ fileName });
}

export async function downloadImages({ selected, refs }) {
  const selectedIds = Object.entries(selected).filter(([_, v]) => v).map(([k]) => parseInt(k));
  if (selectedIds.length === 0) return;

  if (selectedIds.length === 1) {
    const cardId = selectedIds[0];
    const blob = await getRefBlob(refs[cardId]);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${FILE_NAMES[cardId]}.png`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();
  for (const cardId of selectedIds) {
    const blob = await getRefBlob(refs[cardId]);
    if (blob) zip.file(`${FILE_NAMES[cardId]}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'charts.zip';
  a.click();
  URL.revokeObjectURL(url);
}
