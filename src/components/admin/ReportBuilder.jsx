'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Users, Stethoscope, Activity, Download, Image } from 'lucide-react';

import ResidentCountChart from './charts/ResidentCountChart';
import MonthlyHeatmap from './charts/MonthlyHeatmap';
import StageProgressChart from './charts/StageProgressChart';
import AttendingResidentChart from './charts/AttendingResidentChart';
import AttendingMonthlyChart from './charts/AttendingMonthlyChart';
import ComplicationChart from './charts/ComplicationChart';

const MONTHS_HE_FULL = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function ChartTypeSwitcher({ options, value, onChange }) {
  return (
    <div className="flex gap-1 rounded-md bg-muted p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${value === opt.value ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ options, value, onChange }) {
  return (
    <div className="flex gap-1 rounded-md bg-muted p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${value === opt.value ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ReportBuilder({ open, onOpenChange, surgeries, residents }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [selected, setSelected] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
  const [chartTypes, setChartTypes] = useState({ 1: 'donut', 3: 'bars', 4: 'donut', 5: 'bar' });
  const [showTop3, setShowTop3] = useState({ 1: false, 4: false });

  const refs = {
    1: useRef(null), 2: useRef(null), 3: useRef(null),
    4: useRef(null), 5: useRef(null), 6: useRef(null),
  };

  const toggleSelected = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const setChartType = (id, type) => setChartTypes(prev => ({ ...prev, [id]: type }));
  const toggleTop3 = (id) => setShowTop3(prev => ({ ...prev, [id]: !prev[id] }));

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-y-auto p-0" dir="rtl">
        <DialogTitle className="sr-only">בניית דוח למצגת</DialogTitle>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">בניית דוח למצגת</h2>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Card grid */}
        <div className="p-4 space-y-6">
          {/* Section: מתמחים */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">מתמחים</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[1]} onCheckedChange={() => toggleSelected(1)} />
                    <span className="text-xs font-semibold">כמה ניתוחים לכל מתמחה?</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ChartTypeSwitcher
                    options={[{ value: 'donut', label: 'עוגה' }, { value: 'bar', label: 'עמודות' }, { value: 'dots', label: 'נקודות' }]}
                    value={chartTypes[1]}
                    onChange={(v) => setChartType(1, v)}
                  />
                  <ToggleSwitch
                    options={[{ value: false, label: 'כולם' }, { value: true, label: '3 מובילים' }]}
                    value={showTop3[1]}
                    onChange={(v) => toggleTop3(1)}
                  />
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <ResidentCountChart
                    ref={refs[1]}
                    surgeries={surgeries}
                    residents={residents}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    chartType={chartTypes[1]}
                    showTop3={showTop3[1]}
                  />
                </div>
              </Card>

              {/* Card 2 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[2]} onCheckedChange={() => toggleSelected(2)} />
                    <span className="text-xs font-semibold">מתי כל מתמחה ניתח?</span>
                  </div>
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <MonthlyHeatmap
                    ref={refs[2]}
                    surgeries={surgeries}
                    residents={residents}
                    selectedYear={selectedYear}
                  />
                </div>
              </Card>

              {/* Card 3 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[3]} onCheckedChange={() => toggleSelected(3)} />
                    <span className="text-xs font-semibold">לאיזה שלב כל מתמחה הגיע?</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChartTypeSwitcher
                    options={[{ value: 'bars', label: 'פסים' }, { value: 'heatmap', label: 'מפת חום' }]}
                    value={chartTypes[3]}
                    onChange={(v) => setChartType(3, v)}
                  />
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <StageProgressChart
                    ref={refs[3]}
                    surgeries={surgeries}
                    residents={residents}
                    chartType={chartTypes[3]}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Section: מנתחים מפקחים */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">מנתחים מפקחים</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 4 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[4]} onCheckedChange={() => toggleSelected(4)} />
                    <span className="text-xs font-semibold">איזה מפקח פיקח על מי?</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ChartTypeSwitcher
                    options={[{ value: 'donut', label: 'עוגה' }, { value: 'bar', label: 'עמודות' }, { value: 'heatmap', label: 'מפת חום' }]}
                    value={chartTypes[4]}
                    onChange={(v) => setChartType(4, v)}
                  />
                  <ToggleSwitch
                    options={[{ value: false, label: 'כולם' }, { value: true, label: '3 מובילים' }]}
                    value={showTop3[4]}
                    onChange={(v) => toggleTop3(4)}
                  />
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <AttendingResidentChart
                    ref={refs[4]}
                    surgeries={surgeries}
                    residents={residents}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    chartType={chartTypes[4]}
                    showTop3={showTop3[4]}
                  />
                </div>
              </Card>

              {/* Card 5 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[5]} onCheckedChange={() => toggleSelected(5)} />
                    <span className="text-xs font-semibold">כמה ניתוחים פיקח כל מנתח החודש?</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChartTypeSwitcher
                    options={[{ value: 'bar', label: 'עמודות' }, { value: 'donut', label: 'עוגה' }]}
                    value={chartTypes[5]}
                    onChange={(v) => setChartType(5, v)}
                  />
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <AttendingMonthlyChart
                    ref={refs[5]}
                    surgeries={surgeries}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    chartType={chartTypes[5]}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Section: סטטיסטיקה */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">סטטיסטיקה</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 6 */}
              <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selected[6]} onCheckedChange={() => toggleSelected(6)} />
                    <span className="text-xs font-semibold">מה שיעור הסיבוכים?</span>
                  </div>
                </div>
                <div className="border rounded-lg p-2 bg-muted/30 min-h-[200px]">
                  <ComplicationChart
                    ref={refs[6]}
                    surgeries={surgeries}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 z-10 bg-background border-t p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selectedCount} תרשימים נבחרו</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
              <Image className="w-3.5 h-3.5" />
              הורד תמונות
            </Button>
            <Button size="sm" disabled className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              הורד מצגת
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
