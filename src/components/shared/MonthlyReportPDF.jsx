import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";
import { SURGERY_STEPS, PHACO_LASER_STEPS } from './SurgerySteps';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const COMPLICATIONS_LIST = [
  'קרע בקופסית קדמית',
  'קרע בקופסית אחורית',
  'זונוליזיס',
  'ויטרקטומיה קדמית',
  'השתלת עדשה בסולקוס',
];

function SummaryRow({ label, value, bold, indent, redValue }) {
  return (
    <tr style={{ background: bold ? '#f1f5f9' : 'transparent' }}>
      <td style={{ padding: '5px 4px', paddingRight: `${4 + (indent || 0)}px`, fontWeight: bold ? 'bold' : 'normal', fontSize: 13 }}>{label}</td>
      <td style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', color: redValue ? '#b91c1c' : bold ? '#1e293b' : '#334155', width: 60, fontSize: 13 }}>{value}</td>
    </tr>
  );
}

export default function MonthlyReportPDF({ user, surgeries }) {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [renderData, setRenderData] = useState(null);
  const reportRef = useRef(null);
  const years = [now.getFullYear() - 1, now.getFullYear()];

  async function generatePDF() {
    setLoading(true);
    const m = parseInt(month);
    const y = parseInt(year);

    const filtered = surgeries.filter(s => {
      if (!s.surgery_date) return false;
      const d = new Date(s.surgery_date);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const allSteps = [...SURGERY_STEPS, ...PHACO_LASER_STEPS];
    const phacоCount = filtered.filter(s => s.surgery_type !== 'phacolaser').length;
    const phacоlaserCount = filtered.filter(s => s.surgery_type === 'phacolaser').length;
    const fullPhaco = filtered.filter(s => s.surgery_type !== 'phacolaser' && s.steps_performed?.includes('solo')).length;
    const partialWithPhaco = filtered.filter(s => s.surgery_type !== 'phacolaser' && !s.steps_performed?.includes('solo') && (s.steps_performed?.length || 0) > 0 && s.steps_performed?.includes('phacoemulsification')).length;
    const partialWithoutPhaco = filtered.filter(s => s.surgery_type !== 'phacolaser' && !s.steps_performed?.includes('solo') && (s.steps_performed?.length || 0) > 0 && !s.steps_performed?.includes('phacoemulsification')).length;
    const fullPhacoLaser = filtered.filter(s => s.surgery_type === 'phacolaser' && (s.steps_performed?.length || 0) >= PHACO_LASER_STEPS.length).length;
    const partialPhacoLaser = filtered.filter(s => s.surgery_type === 'phacolaser' && (s.steps_performed?.length || 0) > 0 && (s.steps_performed?.length || 0) < PHACO_LASER_STEPS.length).length;
    const toricCount = filtered.filter(s => s.steps_performed?.includes('laser_toric_iol') || s.steps_performed?.includes('toric_iol')).length;
    const complexPupil = filtered.filter(s => s.notes?.includes('הרחבת אישון') || s.complications?.includes('הרחבת אישון')).length;
    const complexMature = filtered.filter(s => s.notes?.includes('ירוד בשל') || s.complications?.includes('ירוד בשל')).length;
    const complexDeep = filtered.filter(s => s.notes?.includes('עין שקועה') || s.complications?.includes('עין שקועה')).length;
    const complexShallowAC = filtered.filter(s => s.notes?.includes('לשכה קדמית רדודה') || s.complications?.includes('לשכה קדמית רדודה')).length;
    const complexTotal = complexPupil + complexMature + complexDeep + complexShallowAC;

    const stepCounts = {};
    filtered.forEach(s => s.steps_performed?.forEach(st => { stepCounts[st] = (stepCounts[st] || 0) + 1; }));
    const sortedSteps = Object.entries(stepCounts).sort((a, b) => b[1] - a[1]);

    const complicationsWithCount = COMPLICATIONS_LIST.map(comp => ({
      label: comp,
      count: filtered.filter(s => s.complications?.includes(comp)).length,
    }));
    const totalComplications = complicationsWithCount.reduce((a, c) => a + c.count, 0);

    const surgeryRows = filtered.map(s => {
      const totalForType = s.surgery_type === 'phacolaser' ? PHACO_LASER_STEPS.length : SURGERY_STEPS.length;
      const isFull = (s.steps_performed?.length || 0) >= totalForType;
      const isPartial = !isFull && (s.steps_performed?.length || 0) > 0;
      const isSolo = s.steps_performed?.includes('solo');
      let status = isSolo ? 'מלא (סולו)' : isPartial ? (s.steps_performed?.includes('phacoemulsification') ? 'חלקי+פאקו' : 'חלקי-פאקו') : 'ללא';
      return { ...s, status, totalForType };
    });

    setRenderData({
      m, y, filtered, allSteps,
      phacоCount, phacоlaserCount, fullPhaco, partialWithPhaco, partialWithoutPhaco,
      fullPhacoLaser, partialPhacoLaser, toricCount,
      complexPupil, complexMature, complexDeep, complexShallowAC, complexTotal,
      sortedSteps, complicationsWithCount, totalComplications, surgeryRows,
    });

    // Wait for React to render the hidden div
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false });
    setRenderData(null);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    let posY = 0;
    let remainingH = imgH;
    while (remainingH > 0) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -posY, pageW, imgH);
      posY += pageH;
      remainingH -= pageH;
    }

    pdf.save(`surgery-report-${MONTHS_HE[m]}-${y}.pdf`);
    setLoading(false);
  }

  const d = renderData;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS_HE.map((m, i) => (
            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-20 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={generatePDF} disabled={loading} className="h-8 text-xs gap-1.5">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
        ייצוא PDF
      </Button>

      {/* Hidden report for html2canvas - rendered inside the real DOM */}
      {d && (
        <div
          ref={reportRef}
          style={{
            position: 'fixed', top: 0, left: '-9999px',
            width: 700, background: 'white',
            fontFamily: 'Arial, sans-serif', direction: 'rtl', color: '#1e293b',
            zIndex: -1,
          }}
        >
          {/* Header */}
          <div style={{ background: '#1e64c8', color: 'white', padding: '18px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>דוח חודשי - הכשרת קטרקט</div>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>{MONTHS_HE[d.m]} {d.y}</div>
          </div>

          <div style={{ padding: '0 24px' }}>
            <div style={{ marginBottom: 6, fontSize: 14 }}><strong>מתמחה:</strong> {user.full_name || user.email}</div>
            <div style={{ marginBottom: 16, fontSize: 12, color: '#64748b' }}>תאריך הפקה: {now.toLocaleDateString('he-IL')}</div>

            {/* Surgery Summary */}
            <SectionTitle>סיכום ניתוחים</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                <SummaryRow label='סה״כ ניתוחים' value={d.filtered.length} bold />
                <SummaryRow label='פאקו - סה״כ' value={d.phacоCount} />
                <SummaryRow label='פאקו - מלא' value={d.fullPhaco} indent={20} />
                <SummaryRow label='פאקו - חלקי עם פאקו' value={d.partialWithPhaco} indent={20} />
                <SummaryRow label='פאקו - חלקי בלי פאקו' value={d.partialWithoutPhaco} indent={20} />
                <SummaryRow label='פאקולייזר - סה״כ' value={d.phacоlaserCount} />
                <SummaryRow label='פאקולייזר - מלא' value={d.fullPhacoLaser} indent={20} />
                <SummaryRow label='פאקולייזר - חלקי' value={d.partialPhacoLaser} indent={20} />
                <SummaryRow label='עדשות טוריות' value={d.toricCount} />
              </tbody>
            </table>

            {/* Complex */}
            <SectionTitle>ניתוחים מורכבים ({d.complexTotal})</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                <SummaryRow label='הרחבת אישון' value={d.complexPupil} indent={20} />
                <SummaryRow label='ירוד בשל' value={d.complexMature} indent={20} />
                <SummaryRow label='עין שקועה' value={d.complexDeep} indent={20} />
                <SummaryRow label='לשכה קדמית רדודה' value={d.complexShallowAC} indent={20} />
              </tbody>
            </table>

            {/* Steps */}
            {d.sortedSteps.length > 0 && (
              <>
                <SectionTitle>תדירות שלבים</SectionTitle>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <tbody>
                    {d.sortedSteps.map(([id, count]) => (
                      <SummaryRow key={id} label={d.allSteps.find(s => s.id === id)?.label || id} value={count} />
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Complications */}
            <SectionTitle red>סיבוכים</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                {d.totalComplications === 0 ? (
                  <tr><td style={{ padding: '5px 4px', color: '#16a34a', fontSize: 13 }}>לא נרשמו סיבוכים</td></tr>
                ) : (
                  d.complicationsWithCount.map(({ label, count }) => (
                    <SummaryRow key={label} label={label} value={count} redValue={count > 0} />
                  ))
                )}
              </tbody>
            </table>

            {/* Detail table */}
            {d.surgeryRows.length > 0 && (
              <>
                <SectionTitle>פירוט ניתוחים</SectionTitle>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#dbeafe', fontWeight: 'bold' }}>
                      {['תאריך','ר"ת','עין','סוג','סטטוס','שלבים','מנתח','סיבוכים'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #bfdbfe' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.surgeryRows.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.surgery_date || ''}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.patient_initials || ''}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.eye === 'right' ? 'ימין' : s.eye === 'left' ? 'שמאל' : ''}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.surgery_type === 'phacolaser' ? 'לייזר' : 'פאקו'}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.status}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.steps_performed?.length || 0}/{s.totalForType}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{s.supervising_surgeon || ''}</td>
                        <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', color: s.complications ? '#b91c1c' : 'inherit' }}>{s.complications || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 10, padding: '12px 0', borderTop: '1px solid #e2e8f0' }}>
              Cataract Training System
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, red }) {
  return (
    <div style={{
      background: red ? '#fff0f0' : '#f0f5ff',
      padding: '10px 14px',
      borderRadius: 6,
      fontWeight: 'bold',
      fontSize: 14,
      color: red ? '#b91c1c' : '#1e40af',
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}