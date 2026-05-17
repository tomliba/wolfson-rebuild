'use client';

import React, { forwardRef } from 'react';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

function cellStyle(count) {
  if (count === 0) return { backgroundColor: '#f3f4f6', color: '#d1d5db' };
  if (count <= 3) return { backgroundColor: '#B5D4F4', color: '#1e3a5f' };
  if (count <= 6) return { backgroundColor: '#378ADD', color: '#ffffff' };
  return { backgroundColor: '#185FA5', color: '#ffffff' };
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
      <div ref={ref} dir="rtl" className="overflow-x-auto" style={{ fontFamily: 'Heebo, sans-serif' }}>
        <table className="w-full text-xs border-collapse" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th className="p-2 text-right font-semibold bg-muted/60 border border-border/50 whitespace-nowrap">מתמחה</th>
              {SURGERY_STEPS.map(step => (
                <th key={step.id} className="p-1 text-center font-medium bg-muted/60 border border-border/50 text-[10px] leading-tight" style={{ minWidth: 48 }}>{step.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.name}>
                <td className="p-2 text-right font-medium border border-border/50 whitespace-nowrap">{r.name}</td>
                {SURGERY_STEPS.map(step => {
                  const count = r.stepCounts[step.id];
                  return (
                    <td key={step.id} className="p-1.5 text-center border border-border/50 font-bold" style={cellStyle(count)}>
                      {count || ''}
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

  return (
    <div ref={ref} dir="rtl" className="space-y-3 p-3" style={{ fontFamily: 'Heebo, sans-serif' }}>
      {data.map(r => (
        <div key={r.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">{r.name}</span>
            <span className="text-xs font-medium text-muted-foreground">{r.doneCount}/{SURGERY_STEPS.length}</span>
          </div>
          <div className="flex gap-0.5 h-6 rounded-md overflow-hidden">
            {SURGERY_STEPS.map(step => {
              const count = r.stepCounts[step.id];
              return (
                <div
                  key={step.id}
                  className="flex-1 flex items-center justify-center text-[9px] font-bold transition-colors"
                  style={{ backgroundColor: barColor(count), color: count > 3 ? '#fff' : count > 0 ? '#1e3a5f' : '#bbb' }}
                  title={`${step.label}: ${count}`}
                >
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex gap-0.5 pt-1">
        {SURGERY_STEPS.map(step => (
          <div key={step.id} className="flex-1 text-center text-[8px] text-muted-foreground leading-tight">{step.label}</div>
        ))}
      </div>
    </div>
  );
});

export default StageProgressChart;
