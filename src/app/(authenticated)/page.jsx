'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Scissors, Film, TrendingUp, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '@/components/shared/StatCard';
import ProgressRing from '@/components/shared/ProgressRing';
import { SURGERY_STEPS, PHACO_LASER_STEPS } from '@/components/shared/SurgerySteps';
import MonthlyReportPDF from '@/components/shared/MonthlyReportPDF';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summaryView, setSummaryView] = useState('month');

  useEffect(() => {
    auth.me().then(setUser);
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => entities.OneTimeTask.list()
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['completions', user?.email],
    queryFn: () => entities.TaskCompletion.filter({ resident_email: user.email }),
    enabled: !!user?.email
  });

  const { data: surgeries = [] } = useQuery({
    queryKey: ['surgeries', user?.email],
    queryFn: () => entities.Surgery.filter({ resident_email: user.email }),
    enabled: !!user?.email
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos', user?.email],
    queryFn: () => entities.VideoReview.filter({ resident_email: user.email }),
    enabled: !!user?.email
  });

  const filteredSurgeries = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const filteredVideos = videos.filter(v => {
    if (!v.review_date) return false;
    const d = new Date(v.review_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const exportToExcel = () => {
    const allSteps = [...SURGERY_STEPS, ...PHACO_LASER_STEPS];

    const detailsData = surgeries
      .slice()
      .sort((a, b) => (a.surgery_date || '').localeCompare(b.surgery_date || ''))
      .map(s => {
        const stepsLabels = (s.steps_performed || [])
          .map(id => allSteps.find(st => st.id === id)?.label || id)
          .join(', ');
        const totalForType = s.surgery_type === 'phacolaser' ? PHACO_LASER_STEPS.length : SURGERY_STEPS.length;
        const isFull = (s.steps_performed?.length || 0) >= totalForType;
        const isPartial = !isFull && (s.steps_performed?.length || 0) > 0;
        const isSolo = s.steps_performed?.includes('solo');
        let surgeryStatus = isSolo ? 'מלא (סולו)' : isPartial ? (s.steps_performed?.includes('phacoemulsification') ? 'חלקי עם פאקו' : 'חלקי בלי פאקו') : 'ללא שלבים';
        const isComplex = s.notes?.includes('הרחבת אישון') || s.complications?.includes('הרחבת אישון') ||
          s.notes?.includes('ירוד בשל') || s.complications?.includes('ירוד בשל') ||
          s.notes?.includes('עין שקועה') || s.complications?.includes('עין שקועה') ||
          s.notes?.includes('לשכה קדמית רדודה') || s.complications?.includes('לשכה קדמית רדודה');
        const hasToric = s.steps_performed?.includes('laser_toric_iol') || s.steps_performed?.includes('toric_iol');

        return {
          'תאריך': s.surgery_date || '',
          'ראשי תיבות מטופל': s.patient_initials || '',
          'עין': s.eye === 'right' ? 'ימין' : s.eye === 'left' ? 'שמאל' : '',
          'סוג ניתוח': s.surgery_type === 'phacolaser' ? 'פאקולייזר' : 'פאקו',
          'סטטוס': surgeryStatus,
          'מנתח מפקח': s.supervising_surgeon || '',

          'מספר שלבים': s.steps_performed?.length || 0,
          'שלבים שבוצעו': stepsLabels,
          'עדשה טורית': hasToric ? 'כן' : 'לא',
          'ניתוח מורכב': isComplex ? 'כן' : 'לא',
          'סיבוכים': s.complications || '',
          'הערות': s.notes || '',
        };
      });

    const phacoTotal = surgeries.filter(s => s.surgery_type !== 'phacolaser').length;
    const phacolaserTotal = surgeries.filter(s => s.surgery_type === 'phacolaser').length;
    const fullCount = surgeries.filter(s => s.surgery_type !== 'phacolaser' && s.steps_performed?.includes('solo')).length;
    const partialWithP = surgeries.filter(s => s.surgery_type !== 'phacolaser' && !s.steps_performed?.includes('solo') && (s.steps_performed?.length || 0) > 0 && s.steps_performed?.includes('phacoemulsification')).length;
    const partialWithoutP = surgeries.filter(s => s.surgery_type !== 'phacolaser' && !s.steps_performed?.includes('solo') && (s.steps_performed?.length || 0) > 0 && !s.steps_performed?.includes('phacoemulsification')).length;
    const fullPhacoLaser = surgeries.filter(s => s.surgery_type === 'phacolaser' && (s.steps_performed?.length || 0) >= PHACO_LASER_STEPS.length).length;
    const partialPhacoLaser = surgeries.filter(s => s.surgery_type === 'phacolaser' && (s.steps_performed?.length || 0) > 0 && (s.steps_performed?.length || 0) < PHACO_LASER_STEPS.length).length;
    const toricExcel = surgeries.filter(s => s.steps_performed?.includes('laser_toric_iol') || s.steps_performed?.includes('toric_iol')).length;
    const complexTotal = surgeries.filter(s =>
      s.notes?.includes('הרחבת אישון') || s.complications?.includes('הרחבת אישון') ||
      s.notes?.includes('ירוד בשל') || s.complications?.includes('ירוד בשל') ||
      s.notes?.includes('עין שקועה') || s.complications?.includes('עין שקועה') ||
      s.notes?.includes('לשכה קדמית רדודה') || s.complications?.includes('לשכה קדמית רדודה')
    ).length;

    const summaryData = [
      { 'קטגוריה': 'סה"כ ניתוחים', 'כמות': surgeries.length },
      { 'קטגוריה': 'פאקו - סה"כ', 'כמות': phacoTotal },
      { 'קטגוריה': 'פאקו - מלא', 'כמות': fullCount },
      { 'קטגוריה': 'פאקו - חלקי עם פאקו', 'כמות': partialWithP },
      { 'קטגוריה': 'פאקו - חלקי בלי פאקו', 'כמות': partialWithoutP },
      { 'קטגוריה': 'פאקולייזר - סה"כ', 'כמות': phacolaserTotal },
      { 'קטגוריה': 'פאקולייזר - מלא', 'כמות': fullPhacoLaser },
      { 'קטגוריה': 'פאקולייזר - חלקי', 'כמות': partialPhacoLaser },
      { 'קטגוריה': 'עדשות טוריות', 'כמות': toricExcel },
      { 'קטגוריה': 'ניתוחים מורכבים - הרחבת אישון', 'כמות': surgeries.filter(s => s.notes?.includes('הרחבת אישון') || s.complications?.includes('הרחבת אישון')).length },
      { 'קטגוריה': 'ניתוחים מורכבים - ירוד בשל', 'כמות': surgeries.filter(s => s.notes?.includes('ירוד בשל') || s.complications?.includes('ירוד בשל')).length },
      { 'קטגוריה': 'ניתוחים מורכבים - עין שקועה', 'כמות': surgeries.filter(s => s.notes?.includes('עין שקועה') || s.complications?.includes('עין שקועה')).length },
      { 'קטגוריה': 'ניתוחים מורכבים - לשכה קדמית רדודה', 'כמות': surgeries.filter(s => s.notes?.includes('לשכה קדמית רדודה') || s.complications?.includes('לשכה קדמית רדודה')).length },
      { 'קטגוריה': 'ניתוחים מורכבים - סה"כ', 'כמות': complexTotal },
    ];

    const stepCountsExcel = {};
    surgeries.forEach(s => s.steps_performed?.forEach(st => { stepCountsExcel[st] = (stepCountsExcel[st] || 0) + 1; }));
    const stepsData = allSteps
      .filter(st => stepCountsExcel[st.id])
      .sort((a, b) => (stepCountsExcel[b.id] || 0) - (stepCountsExcel[a.id] || 0))
      .map(st => ({ 'שלב': st.label, 'מספר פעמים': stepCountsExcel[st.id] || 0 }));

    const complicationsData = [
      { 'סיבוך': 'קרע קופסית קדמית', 'כמות': surgeries.filter(s => s.complications?.includes('קרע בקופסית קדמית')).length },
      { 'סיבוך': 'קרע קופסית אחורית', 'כמות': surgeries.filter(s => s.complications?.includes('קרע בקופסית אחורית')).length },
      { 'סיבוך': 'זונוליזיס', 'כמות': surgeries.filter(s => s.complications?.includes('זונוליזיס')).length },
      { 'סיבוך': 'ויטרקטומיה קדמית', 'כמות': surgeries.filter(s => s.complications?.includes('ויטרקטומיה קדמית')).length },
      { 'סיבוך': 'השתלת עדשה בסולקוס', 'כמות': surgeries.filter(s => s.complications?.includes('השתלת עדשה בסולקוס')).length },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailsData), 'ניתוחים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'סיכום');
    if (stepsData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stepsData), 'שלבים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(complicationsData), 'סיבוכים');
    XLSX.writeFile(wb, `ניתוחים_${user.full_name || user.email}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (!user) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const taskProgress = tasks.length > 0 ? (completions.length / tasks.length) * 100 : 0;
  const filteredVideosPresented = filteredVideos.filter(v => v.presented_in_meeting).length;

  const yearlySurgeries = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getFullYear() === selectedYear;
  });

  const summarySurgeries = summaryView === 'year' ? yearlySurgeries : filteredSurgeries;

  const phacolaserCount = summarySurgeries.filter(s => s.surgery_type === 'phacolaser').length;

  const toricCount = summarySurgeries.filter(s =>
    s.steps_performed?.includes('laser_toric_iol') || s.steps_performed?.includes('toric_iol')
  ).length;

  const complexSurgeries = {
    pupilExpansion: summarySurgeries.filter(s => s.notes?.includes('הרחבת אישון') || s.complications?.includes('הרחבת אישון')).length,
    matureICE: summarySurgeries.filter(s => s.notes?.includes('ירוד בשל') || s.complications?.includes('ירוד בשל')).length,
    deepSet: summarySurgeries.filter(s => s.notes?.includes('עין שקועה') || s.complications?.includes('עין שקועה')).length,
    shallowAC: summarySurgeries.filter(s => s.notes?.includes('לשכה קדמית רדודה') || s.complications?.includes('לשכה קדמית רדודה')).length,
  };
  const totalComplex = Object.values(complexSurgeries).reduce((a, b) => a + b, 0);

  const complications = {
    anteriorCapsuleTear: summarySurgeries.filter(s => s.complications?.includes('קרע בקופסית קדמית')).length,
    posteriorCapsuleTear: summarySurgeries.filter(s => s.complications?.includes('קרע בקופסית אחורית')).length,
    zonulysis: summarySurgeries.filter(s => s.complications?.includes('זונוליזיס')).length,
    anteriorVitrectomy: summarySurgeries.filter(s => s.complications?.includes('ויטרקטומיה קדמית')).length,
    sulcusIOL: summarySurgeries.filter(s => s.complications?.includes('השתלת עדשה בסולקוס')).length,
  };
  const totalComplications = Object.values(complications).reduce((a, b) => a + b, 0);

  const MONTHS_HE_FULL = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const MONTHS_HE = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];
  const monthlyCounts = MONTHS_HE.map((name, i) => {
    const monthly = surgeries.filter(s => {
      if (!s.surgery_date) return false;
      const d = new Date(s.surgery_date);
      return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
    }).length;
    return { name, ניתוחים: monthly };
  });
  let cumulative = 0;
  const monthlyCountsWithCumulative = monthlyCounts.map(d => {
    cumulative += d.ניתוחים;
    return { ...d, מצטבר: cumulative };
  });

  const fullSurgeries = summarySurgeries.filter(s => s.surgery_type !== 'phacolaser' && s.steps_performed?.includes('solo')).length;
  const manualPartialWithPhaco = summarySurgeries.filter(s =>
    s.surgery_type !== 'phacolaser' &&
    !s.steps_performed?.includes('solo') &&
    (s.steps_performed?.length || 0) > 0 &&
    s.steps_performed?.includes('phacoemulsification')
  ).length;
  const manualPartialWithoutPhaco = summarySurgeries.filter(s =>
    s.surgery_type !== 'phacolaser' &&
    !s.steps_performed?.includes('solo') &&
    (s.steps_performed?.length || 0) > 0 &&
    !s.steps_performed?.includes('phacoemulsification')
  ).length;
  const manualPartialSurgeries = manualPartialWithPhaco + manualPartialWithoutPhaco;
  const phacoTotal = summarySurgeries.filter(s => s.surgery_type !== 'phacolaser').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            שלום, {user.full_name || 'מתמחה'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">סקירת התקדמות בהכשרת קטרקט</p>
        </div>
        <div className="flex gap-2">
          <MonthlyReportPDF user={user} surgeries={surgeries} month={selectedMonth} year={selectedYear} onMonthChange={(v) => setSelectedMonth(parseInt(v))} onYearChange={(v) => setSelectedYear(parseInt(v))} />
          <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            ייצוא לאקסל
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
        <StatCard title="מטלות שהושלמו" value={`${completions.length}/${tasks.length}`} icon={ClipboardCheck} color="primary" />
        <StatCard title="ניתוחים" value={filteredSurgeries.length} icon={Scissors} color="accent" />
        <StatCard title="סרטים שנצפו" value={filteredVideos.length} icon={Film} color="chart1" />
        <StatCard title="הוצגו בשמיים" value={filteredVideosPresented} icon={TrendingUp} color="primary" />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">ניתוחים לפי חודש ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyCountsWithCumulative} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                    <p>ניתוחים בחודש: <strong>{d.ניתוחים}</strong></p>
                    <p>מצטבר: <strong>{d.מצטבר}</strong></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="ניתוחים" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center">
          <ProgressRing progress={taskProgress} size={100} strokeWidth={8} />
          <p className="text-sm font-medium text-foreground mt-3">התקדמות במטלות</p>
          <p className="text-xs text-muted-foreground">{completions.length} מתוך {tasks.length} הושלמו</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">סיכום ניתוחים</h3>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button onClick={() => setSummaryView('month')} className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${summaryView === 'month' ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {MONTHS_HE_FULL[selectedMonth]}
              </button>
              <button onClick={() => setSummaryView('year')} className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${summaryView === 'year' ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {selectedYear}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">סה״כ ניתוחים</span>
              <span className="text-sm font-bold text-foreground">{summarySurgeries.length}</span>
            </div>
            <div className="pr-3 space-y-1.5 border-r-2 border-primary/30">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">סולו</span>
                <span className="text-xs font-bold text-foreground">{fullSurgeries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">חלקי עם פאקו</span>
                <span className="text-xs font-bold text-foreground">{manualPartialWithPhaco}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">חלקי בלי פאקו</span>
                <span className="text-xs font-bold text-foreground">{manualPartialWithoutPhaco}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">פאקולייזר</span>
                <span className="text-xs font-bold text-accent">{phacolaserCount}</span>
              </div>
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">השתלת עדשות טוריות <span className="text-[10px] font-normal text-muted-foreground/60">(נפרד)</span></span>
                <span className="text-xs font-bold text-primary">{toricCount}</span>
              </div>
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-foreground">ניתוחים מורכבים <span className="text-[10px] font-normal text-muted-foreground/60">(נפרד)</span> ({totalComplex})</span>
              </div>
              <div className="pr-3 space-y-1.5 border-r-2 border-chart-3/40">
                {[
                  { label: 'הרחבת אישון', value: complexSurgeries.pupilExpansion },
                  { label: 'ירוד בשל', value: complexSurgeries.matureICE },
                  { label: 'עין שקועה', value: complexSurgeries.deepSet },
                  { label: 'לשכה קדמית רדודה', value: complexSurgeries.shallowAC },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-destructive">סיבוכים ({totalComplications})</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'קרע קופסית קדמית', value: complications.anteriorCapsuleTear },
                  { label: 'קרע קופסית אחורית', value: complications.posteriorCapsuleTear },
                  { label: 'זונוליזיס', value: complications.zonulysis },
                  { label: 'ויטרקטומיה קדמית', value: complications.anteriorVitrectomy },
                  { label: 'השתלת עדשה בסולקוס', value: complications.sulcusIOL },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-xs font-bold ${value > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">סרטי ניתוחים</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">סה״כ סרטים</span>
              <span className="text-sm font-bold text-foreground">{filteredVideos.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">הוצגו בשמיים</span>
              <span className="text-sm font-bold text-accent">{filteredVideosPresented}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">ממתינים להצגה</span>
              <span className="text-sm font-bold text-foreground">{filteredVideos.length - filteredVideosPresented}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
