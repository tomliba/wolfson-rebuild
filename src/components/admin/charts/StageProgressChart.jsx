'use client';

import React, { forwardRef } from 'react';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

function cellColor(count) {
  if (count === 0) return { bg: '#e5e7eb', text: '#9ca3af' };
  if (count <= 3) return { bg: '#B5D4F4', text: '#1e3a5f' };
  if (count <= 6) return { bg: '#378ADD', text: '#ffffff' };
  return { bg: '#185FA5', text: '#ffffff' };
}

function barColor(count) {
  if (count === 0) return '#e5e7eb';
  if (count <= 3) return '#B5D4F4';
  if (count <= 6) return '#378ADD';
  return '#185FA5';
}

const StageProgressChart = forwardRef(function StageProgressChart({ surgeries, residents, chartType }, ref) {
  const data = residents.map(r => {
    const residentSurgeries = surgeries.filter(s => s.resident_email === r.email);
    const stepCounts = {};
    let doneCount = 0;
    SURGERY_STEPS.forEach(step => {
      const count = residentSurgeries.filter(s => s.steps_performed?.includes(step.id)).length;
      stepCounts[step.id] = count;
      if (count > 0) doneCount++;
    });
    return { name: r.full_name || r.email, stepCounts, doneCount };
  });

  if (chartType === 'heatmap') {
    return (
      <div ref={ref} dir="rtl" className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1.5 text-right font-semibold border border-border bg-muted">מתמחה</th>
              {SURGERY_STEPS.map(step => (
                <th key={step.id} className="p-1 text-center font-medium border border-border bg-muted text-[10px] leading-tight min-w-[44px]">{step.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.name}>
                <td className="p-1.5 text-right font-medium border border-border">{r.name}</td>
                {SURGERY_STEPS.map(step => {
                  const count = r.stepCounts[step.id];
                  const c = cellColor(count);
                  return (
                    <td key={step.id} className="p-1.5 text-center border border-border font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: progress bars
  return (
    <div ref={ref} dir="rtl" className="space-y-3 p-3">
      {data.map(r => (
        <div key={r.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{r.name}</span>
            <span className="text-xs text-muted-foreground">{r.doneCount}/{SURGERY_STEPS.length}</span>
          </div>
          <div className="flex gap-0.5 h-5 rounded overflow-hidden">
            {SURGERY_STEPS.map(step => {
              const count = r.stepCounts[step.id];
              return (
                <div
                  key={step.id}
                  className="flex-1 flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: barColor(count), color: count > 3 ? '#fff' : count > 0 ? '#1e3a5f' : '#9ca3af' }}
                  title={`${step.label}: ${count}`}
                >
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex gap-0.5 mt-2">
        {SURGERY_STEPS.map(step => (
          <div key={step.id} className="flex-1 text-center text-[8px] text-muted-foreground leading-tight">{step.label}</div>
        ))}
      </div>
    </div>
  );
});

export default StageProgressChart;
