'use client';

import React, { forwardRef } from 'react';

const MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];

function cellStyle(count) {
  if (count === 0) return { backgroundColor: '#f3f4f6', color: '#d1d5db' };
  if (count <= 3) return { backgroundColor: '#B5D4F4', color: '#1e3a5f' };
  if (count <= 6) return { backgroundColor: '#378ADD', color: '#ffffff' };
  return { backgroundColor: '#185FA5', color: '#ffffff' };
}

const MonthlyHeatmap = forwardRef(function MonthlyHeatmap({ surgeries, residents, selectedYear }, ref) {
  const sortedResidents = [...residents].sort((a, b) =>
    (a.full_name || a.email).localeCompare(b.full_name || b.email, 'he')
  );

  const data = sortedResidents.map(r => {
    const monthly = MONTHS.map((_, i) => {
      return surgeries.filter(s => {
        if (s.resident_email !== r.email || !s.surgery_date) return false;
        const d = new Date(s.surgery_date);
        return d.getMonth() === i && d.getFullYear() === selectedYear;
      }).length;
    });
    const total = monthly.reduce((a, b) => a + b, 0);
    return { name: r.full_name || r.email, monthly, total };
  });

  return (
    <div ref={ref} dir="rtl" className="overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: 480 }}>
        <thead>
          <tr>
            <th className="p-2 text-right font-semibold bg-muted/60 border border-border/50 whitespace-nowrap">מתמחה</th>
            {MONTHS.map(m => (
              <th key={m} className="p-1.5 text-center font-medium bg-muted/60 border border-border/50 w-9">{m}</th>
            ))}
            <th className="p-1.5 text-center font-bold bg-muted/60 border border-border/50 w-10">סה"כ</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.name}>
              <td className="p-2 text-right font-medium border border-border/50 whitespace-nowrap">{r.name}</td>
              {r.monthly.map((count, i) => (
                <td key={i} className="p-1.5 text-center border border-border/50 font-bold rounded-sm" style={cellStyle(count)}>
                  {count || ''}
                </td>
              ))}
              <td className="p-1.5 text-center font-bold border border-border/50 bg-muted/40">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default MonthlyHeatmap;
