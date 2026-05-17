'use client';

import React, { forwardRef } from 'react';

const MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];

function cellColor(count) {
  if (count === 0) return { bg: '#e5e7eb', text: '#9ca3af' };
  if (count <= 3) return { bg: '#B5D4F4', text: '#1e3a5f' };
  if (count <= 6) return { bg: '#378ADD', text: '#ffffff' };
  return { bg: '#185FA5', text: '#ffffff' };
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
    <div ref={ref} dir="rtl" className="overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1.5 text-right font-semibold border border-border bg-muted">מתמחה</th>
            {MONTHS.map(m => (
              <th key={m} className="p-1.5 text-center font-medium border border-border bg-muted min-w-[36px]">{m}</th>
            ))}
            <th className="p-1.5 text-center font-semibold border border-border bg-muted">סה"כ</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.name}>
              <td className="p-1.5 text-right font-medium border border-border">{r.name}</td>
              {r.monthly.map((count, i) => {
                const c = cellColor(count);
                return (
                  <td key={i} className="p-1.5 text-center border border-border font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                    {count}
                  </td>
                );
              })}
              <td className="p-1.5 text-center font-bold border border-border bg-muted">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default MonthlyHeatmap;
