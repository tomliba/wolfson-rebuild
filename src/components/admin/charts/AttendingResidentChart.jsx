'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#639922','#5F5E5A','#85B7EB','#5DCAA5','#F0997B','#AFA9EC','#ED93B1','#97C459'];

function cellColor(count) {
  if (count === 0) return { bg: '#e5e7eb', text: '#9ca3af' };
  if (count <= 3) return { bg: '#B5D4F4', text: '#1e3a5f' };
  if (count <= 6) return { bg: '#378ADD', text: '#ffffff' };
  return { bg: '#185FA5', text: '#ffffff' };
}

const AttendingResidentChart = forwardRef(function AttendingResidentChart({ surgeries, residents, selectedMonth, selectedYear, chartType, showTop3 }, ref) {
  const filtered = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const supervisors = [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))];
  let donutData = supervisors.map(sup => ({
    name: sup,
    value: filtered.filter(s => s.supervising_surgeon === sup).length,
  })).sort((a, b) => b.value - a.value);

  if (showTop3 && donutData.length > 3) {
    const top3 = donutData.slice(0, 3);
    const rest = donutData.slice(3).reduce((sum, d) => sum + d.value, 0);
    donutData = [...top3, { name: 'אחרים', value: rest }];
  }

  const total = donutData.reduce((s, d) => s + d.value, 0);

  if (chartType === 'heatmap') {
    const sortedSups = [...supervisors].sort();
    return (
      <div ref={ref} dir="rtl" className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1.5 text-right font-semibold border border-border bg-muted">מנתח מפקח</th>
              {residents.map(r => (
                <th key={r.email} className="p-1 text-center font-medium border border-border bg-muted text-[10px]">{r.full_name || r.email}</th>
              ))}
              <th className="p-1.5 text-center font-semibold border border-border bg-muted">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {sortedSups.map(sup => {
              const rowTotal = filtered.filter(s => s.supervising_surgeon === sup).length;
              return (
                <tr key={sup}>
                  <td className="p-1.5 text-right font-medium border border-border">{sup}</td>
                  {residents.map(r => {
                    const count = filtered.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length;
                    const c = cellColor(count);
                    return (
                      <td key={r.email} className="p-1.5 text-center border border-border font-bold" style={{ backgroundColor: c.bg, color: c.text }}>
                        {count}
                      </td>
                    );
                  })}
                  <td className="p-1.5 text-center font-bold border border-border bg-muted">{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (chartType === 'bar') {
    return (
      <div ref={ref} dir="rtl" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={donutData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
            <Bar dataKey="value" name="ניתוחים" radius={[0, 4, 4, 0]}>
              {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: donut
  return (
    <div ref={ref} dir="rtl" style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} style={{ fontSize: 10 }}>
            {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Legend formatter={(value) => {
            const item = donutData.find(d => d.name === value);
            return `${value}: ${item?.value || 0} (${total ? ((item?.value / total) * 100).toFixed(0) : 0}%)`;
          }} wrapperStyle={{ fontSize: 11, direction: 'rtl' }} />
          <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default AttendingResidentChart;
