'use client';

import React, { useState, useEffect } from 'react';
import { entities, auth } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Users, ClipboardCheck, Scissors, Film, ChevronLeft, Download, FileText, Eye, EyeOff, Trash2 } from "lucide-react";
import ReportBuilder from '@/components/admin/ReportBuilder';
import ProgressRing from '@/components/shared/ProgressRing';
import TaskList from '@/components/tasks/TaskList';
import SurgeryCard from '@/components/surgery/SurgeryCard';
import StepsSummary from '@/components/surgery/StepsSummary';
import VideoCard from '@/components/video/VideoCard';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';
import * as XLSX from 'xlsx';

const MONTHS_HE = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];
const MONTHS_HE_FULL = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [reportBuilderOpen, setReportBuilderOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then((u) => {
      if (u && u.role !== 'admin') {
        router.push('/');
      } else {
        setUser(u);
      }
    });
  }, [router]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => entities.User.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => entities.OneTimeTask.list()
  });

  const { data: allCompletions = [] } = useQuery({
    queryKey: ['all-completions'],
    queryFn: () => entities.TaskCompletion.list()
  });

  const { data: allSurgeries = [] } = useQuery({
    queryKey: ['all-surgeries'],
    queryFn: () => entities.Surgery.list('-surgery_date')
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ['all-videos'],
    queryFn: () => entities.VideoReview.list('-review_date')
  });

  if (!user) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const allResidents = users.filter(u => u.role !== 'admin');
  const activeResidents = allResidents.filter(u => u.active !== false);
  const hiddenResidents = allResidents.filter(u => u.active === false);
  const residents = activeResidents;
  const displayResidents = showHidden ? [...activeResidents, ...hiddenResidents] : activeResidents;

  const toggleResidentActive = async (resident, e) => {
    e.stopPropagation();
    const newActive = resident.active === false ? true : false;
    await entities.User.update(resident.id, { active: newActive });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handlePermanentDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/delete-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: selectedResident.id,
          residentEmail: selectedResident.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['surgeries'] });
        queryClient.invalidateQueries({ queryKey: ['completions'] });
        queryClient.invalidateQueries({ queryKey: ['videos'] });
        setSelectedResident(null);
        setShowDeleteConfirm(false);
      } else {
        alert('שגיאה במחיקה: ' + JSON.stringify(data.results));
      }
    } catch (err) {
      alert('שגיאה: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getResidentData = (email) => {
    const completions = allCompletions.filter(c => c.resident_email === email);
    const surgeries = allSurgeries.filter(s => s.resident_email === email);
    const videos = allVideos.filter(v => v.resident_email === email);
    const taskProgress = tasks.length > 0 ? (completions.length / tasks.length) * 100 : 0;
    return { completions, surgeries, videos, taskProgress };
  };

  if (selectedResident) {
    const data = getResidentData(selectedResident.email);
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
        <button
          onClick={() => setSelectedResident(null)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          חזרה לרשימת מתמחים
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {selectedResident.full_name?.[0] || selectedResident.email[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedResident.full_name || selectedResident.email}</h1>
            <p className="text-xs text-muted-foreground">{selectedResident.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <ProgressRing progress={data.taskProgress} size={50} strokeWidth={4} />
            <p className="text-xs text-muted-foreground mt-2">מטלות</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.surgeries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">ניתוחים</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{data.videos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">סרטים</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{data.videos.filter(v => v.presented_in_meeting).length}</p>
            <p className="text-xs text-muted-foreground mt-1">הוצגו בשמיים</p>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            מטלות חד-פעמיות
          </h2>
          <TaskList tasks={tasks} completions={data.completions} isAdmin={true} onComplete={() => {}} onRemoveCompletion={() => {}} />
        </div>

        {data.surgeries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Scissors className="w-5 h-5 text-accent" />
              ניתוחים ({data.surgeries.length})
            </h2>
            <StepsSummary surgeries={data.surgeries} />
            <div className="space-y-3">
              {data.surgeries.map(s => (
                <SurgeryCard key={s.id} surgery={s} isAdmin={true} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          </div>
        )}

        {data.videos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              סרטי ניתוחים ({data.videos.length})
            </h2>
            <div className="space-y-3">
              {data.videos.map(v => (
                <VideoCard key={v.id} review={v} isAdmin={true} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6 mt-6">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            מחיקה לצמיתות
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <Card className="p-6 max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-foreground">מחיקה לצמיתות</h3>
              <p className="text-sm text-muted-foreground">
                פעולה זו תמחק את המתמחה וכל הנתונים שלו לצמיתות. האם להמשיך?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  disabled={deleting}
                >
                  ביטול
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'מוחק...' : 'מחק'}
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Section 1: Resident surgery summary by month for selected year
  const surgerySummaryData = residents.map(r => {
    const monthly = MONTHS_HE.map((_, i) => {
      return allSurgeries.filter(s => {
        if (s.resident_email !== r.email || !s.surgery_date) return false;
        const d = new Date(s.surgery_date);
        return d.getMonth() === i && d.getFullYear() === selectedYear;
      }).length;
    });
    const total = monthly.reduce((a, b) => a + b, 0);
    return { name: r.full_name || r.email, email: r.email, monthly, total };
  });
  const monthlyTotals = MONTHS_HE.map((_, i) =>
    surgerySummaryData.reduce((sum, r) => sum + r.monthly[i], 0)
  );
  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

  // Section 2: Surgeries by supervising surgeon (filtered by selected month+year)
  const monthFilteredSurgeries = allSurgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });
  const supervisors = [...new Set(monthFilteredSurgeries.map(s => s.supervising_surgeon).filter(Boolean))].sort();

  // Section 3: Surgery step progression (all-time per year)
  const yearFilteredSurgeries = allSurgeries.filter(s => {
    if (!s.surgery_date) return false;
    return new Date(s.surgery_date).getFullYear() === selectedYear;
  });

  const stepProgressionData = residents.map(r => {
    const residentSurgeries = yearFilteredSurgeries.filter(s => s.resident_email === r.email);
    const stepCounts = {};
    SURGERY_STEPS.forEach(step => {
      stepCounts[step.id] = residentSurgeries.filter(s => s.steps_performed?.includes(step.id)).length;
    });
    return { name: r.full_name || r.email, stepCounts };
  });

  const stepCellColor = (count) => {
    if (count === 0) return 'bg-muted text-muted-foreground';
    if (count <= 5) return 'bg-blue-100 text-blue-800';
    return 'bg-blue-600 text-white';
  };

  // Excel export
  const exportAdminExcel = () => {
    // Sheet 1: Surgery count summary by month per resident
    const sheet1Data = surgerySummaryData.map(r => {
      const row = { 'מתמחה': r.name };
      MONTHS_HE.forEach((m, i) => { row[m] = r.monthly[i]; });
      row['סה"כ'] = r.total;
      return row;
    });
    const totalsRow = { 'מתמחה': 'סה"כ' };
    MONTHS_HE.forEach((m, i) => { totalsRow[m] = monthlyTotals[i]; });
    totalsRow['סה"כ'] = grandTotal;
    sheet1Data.push(totalsRow);

    // Sheet 2: Surgeries by supervising surgeon
    const sheet2Data = [];
    supervisors.forEach(sup => {
      const row = { 'מנתח מפקח': sup };
      residents.forEach(r => {
        const name = r.full_name || r.email;
        row[name] = monthFilteredSurgeries.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length;
      });
      sheet2Data.push(row);
    });

    // Sheet 3: Step progression
    const sheet3Data = stepProgressionData.map(r => {
      const row = { 'מתמחה': r.name };
      SURGERY_STEPS.forEach(step => { row[step.label] = r.stepCounts[step.id]; });
      return row;
    });

    // Sheet 4: All surgeries detail for all residents
    const residentNameMap = {};
    residents.forEach(r => { residentNameMap[r.email] = r.full_name || r.email; });
    const sheet4Data = allSurgeries
      .filter(s => residentNameMap[s.resident_email])
      .map(s => ({
        'מתמחה': residentNameMap[s.resident_email],
        'תאריך': s.surgery_date || '',
        'סוג': s.surgery_type === 'phacolaser' ? 'פאקולייזר' : 'פאקו',
        'עין': s.eye === 'right' ? 'ימין' : s.eye === 'left' ? 'שמאל' : '',
        'מנתח מפקח': s.supervising_surgeon || '',
        'שלבים': (s.steps_performed || []).join(', '),
        'סיבוכים': s.complications || '',
        'הערות': s.notes || '',
      }));

    // Sheet 5: All video reviews for all residents
    const sheet5Data = allVideos
      .filter(v => residentNameMap[v.resident_email])
      .map(v => ({
        'מתמחה': residentNameMap[v.resident_email],
        'תאריך': v.review_date || '',
        'רופא בכיר': v.senior_doctor || '',
        'תיאור': v.video_description || '',
        'משוב': v.feedback || '',
        'הוצג בישיבת שמיים': v.presented_in_meeting ? 'כן' : 'לא',
        'תאריך ישיבה': v.meeting_date || '',
        'הערות': v.notes || '',
      }));

    // Sheet 6: Task completions for all residents
    const taskNameMap = {};
    tasks.forEach(t => { taskNameMap[t.id] = t.title; });
    const sheet6Data = allCompletions
      .filter(c => residentNameMap[c.resident_email])
      .map(c => ({
        'מתמחה': residentNameMap[c.resident_email],
        'מטלה': taskNameMap[c.task_id] || c.task_id,
        'תאריך השלמה': c.completed_at || c.created_at || '',
      }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1Data), 'סיכום ניתוחים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2Data), 'לפי מנתח מפקח');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet3Data), 'התקדמות שלבים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet4Data), 'כל הניתוחים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet5Data), 'סרטי ניתוחים');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet6Data), 'מטלות');
    XLSX.writeFile(wb, `דוח_מתמחים_${MONTHS_HE_FULL[selectedMonth]}_${selectedYear}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">פאנל ניהול</h1>
            <p className="text-xs text-muted-foreground">{activeResidents.length} מתמחים פעילים{hiddenResidents.length > 0 ? ` | ${hiddenResidents.length} מוסתרים` : ''}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_HE_FULL.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportAdminExcel} className="h-8 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            ייצוא לאקסל
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReportBuilderOpen(true)} className="h-8 text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            בניית דוח למצגת
          </Button>
          {hiddenResidents.length > 0 && (
            <Button variant={showHidden ? "secondary" : "ghost"} size="sm" onClick={() => setShowHidden(!showHidden)} className="h-8 text-xs gap-1.5">
              {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHidden ? 'הסתר מוסתרים' : 'הצג מתמחים מוסתרים'}
            </Button>
          )}
        </div>
      </div>

      <ReportBuilder
        open={reportBuilderOpen}
        onOpenChange={setReportBuilderOpen}
        surgeries={allSurgeries}
        residents={residents}
      />

      <div className="grid gap-3">
        {displayResidents.map((resident) => {
          const isHidden = resident.active === false;
          const data = getResidentData(resident.email);
          return (
            <Card
              key={resident.id}
              className={`p-4 cursor-pointer transition-all ${isHidden ? 'opacity-50 border-dashed' : 'hover:shadow-md hover:border-primary/20'}`}
              onClick={() => setSelectedResident(resident)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isHidden ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  {resident.full_name?.[0] || resident.email[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${isHidden ? 'text-muted-foreground' : 'text-foreground'}`}>{resident.full_name || resident.email}</h3>
                  <p className="text-xs text-muted-foreground">{resident.email}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground">מטלות</p>
                    <ProgressRing progress={data.taskProgress} size={36} strokeWidth={3} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">ניתוחים</p>
                    <p className="font-bold text-sm">{data.surgeries.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">סרטים</p>
                    <p className="font-bold text-sm">{data.videos.length}</p>
                  </div>
                  <button
                    onClick={(e) => toggleResidentActive(resident, e)}
                    className={`p-1.5 rounded-md transition-colors ${isHidden ? 'hover:bg-primary/10 text-muted-foreground hover:text-primary' : 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'}`}
                    title={isHidden ? 'הצג מתמחה' : 'הסתר מתמחה'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
        {activeResidents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">אין מתמחים רשומים עדיין</p>
            <p className="text-xs mt-1">הזמן מתמחים דרך הגדרות המערכת</p>
          </div>
        )}
      </div>

      {/* Section 1: Resident Surgery Summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">סיכום ניתוחים למתמחים ({selectedYear})</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-semibold">מתמחה</TableHead>
              {MONTHS_HE.map(m => (
                <TableHead key={m} className="text-center text-xs px-1">{m}</TableHead>
              ))}
              <TableHead className="text-center font-semibold">סה"כ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surgerySummaryData.map(r => (
              <TableRow key={r.email}>
                <TableCell className="text-right text-xs font-medium">{r.name}</TableCell>
                {r.monthly.map((count, i) => (
                  <TableCell key={i} className="text-center text-xs">{count || ''}</TableCell>
                ))}
                <TableCell className="text-center text-xs font-bold">{r.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-right text-xs font-bold">סה"כ</TableCell>
              {monthlyTotals.map((t, i) => (
                <TableCell key={i} className="text-center text-xs font-bold">{t || ''}</TableCell>
              ))}
              <TableCell className="text-center text-xs font-bold">{grandTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Section 2: Surgeries by Supervising Surgeon */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">ניתוחים לפי מנתח מפקח</h3>
        <p className="text-xs text-muted-foreground mb-4">{MONTHS_HE_FULL[selectedMonth]} {selectedYear}</p>
        {supervisors.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">אין נתונים לחודש הנבחר</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right font-semibold">מנתח מפקח</TableHead>
                {residents.map(r => (
                  <TableHead key={r.email} className="text-center text-xs px-1">{r.full_name || r.email}</TableHead>
                ))}
                <TableHead className="text-center font-semibold">סה"כ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisors.map(sup => {
                const rowTotal = residents.reduce((sum, r) =>
                  sum + monthFilteredSurgeries.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length, 0
                );
                return (
                  <TableRow key={sup}>
                    <TableCell className="text-right text-xs font-medium">{sup}</TableCell>
                    {residents.map(r => {
                      const count = monthFilteredSurgeries.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length;
                      return <TableCell key={r.email} className="text-center text-xs">{count || ''}</TableCell>;
                    })}
                    <TableCell className="text-center text-xs font-bold">{rowTotal}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Section 3: Surgery Stage Progression */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">התקדמות שלבי ניתוח</h3>
        <p className="text-xs text-muted-foreground mb-4">{selectedYear}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-semibold">מתמחה</TableHead>
              {SURGERY_STEPS.map(step => (
                <TableHead key={step.id} className="text-center text-[10px] px-1 leading-tight">{step.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stepProgressionData.map(r => (
              <TableRow key={r.name}>
                <TableCell className="text-right text-xs font-medium">{r.name}</TableCell>
                {SURGERY_STEPS.map(step => {
                  const count = r.stepCounts[step.id];
                  return (
                    <TableCell key={step.id} className={`text-center text-xs font-bold ${stepCellColor(count)}`}>
                      {count}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
