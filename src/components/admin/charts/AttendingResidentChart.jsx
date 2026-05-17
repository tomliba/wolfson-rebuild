'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#639922','#5F5E5A','#85B7EB','#5DCAA5','#F0997B','#AFA9EC','#ED93B1','#97C459'];

function cellStyle(count) {
  if (count === 0) return { backgroundColor: '#f3f4f6', color: '#d1d5db' };
  if (count <= 3) return { backgroundColor: '#B5D4F4', color: '#1e3a5f' };
  if (count <= 6) return { backgroundColor: '#378ADD', color: '#ffffff' };
  return { backgroundColor: '#185FA5', color: '#ffffff' };
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
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (showTop3 && donutData.length > 3) {
    const top3 = donutData.slice(0, 3);
    const rest = donutData.slice(3).reduce((sum, d) => sum + d.value, 0);
    donutData = [...top3, { name: 'אחרים', value: rest }];
  }

  const total = donutData.reduce((s, d) => s + d.value, 0);

  if (donutData.length === 0) {
    return <div ref={ref} className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  if (chartType === 'heatmap') {
    const sortedSups = [...supervisors].sort();
    return (
      <div ref={ref} dir="rtl" className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 400 }}>
          <thead>
            <tr>
              <th className="p-2 text-right font-semibold bg-muted/60 border border-border/50 whitespace-nowrap">מנתח מפקח</th>
              {residents.map(r => (
                <th key={r.email} className="p-1 text-center font-medium bg-muted/60 border border-border/50 text-[10px]">{r.full_name || r.email}</th>
              ))}
              <th className="p-1.5 text-center font-bold bg-muted/60 border border-border/50">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {sortedSups.map(sup => {
              const rowTotal = filtered.filter(s => s.supervising_surgeon === sup).length;
              return (
                <tr key={sup}>
                  <td className="p-2 text-right font-medium border border-border/50 whitespace-nowrap">{sup}</td>
                  {residents.map(r => {
                    const count = filtered.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length;
                    return (
                      <td key={r.email} className="p-1.5 text-center border border-border/50 font-bold" style={cellStyle(count)}>
                        {count || ''}
                      </td>
                    );
                  })}
                  <td className="p-1.5 text-center font-bold border border-border/50 bg-muted/40">{rowTotal}</td>
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
      <div ref={ref} dir="rtl" style={{ width: '100%', height: Math.max(200, donutData.length * 40 + 40) }}>
        <ResponsiveContainer>
          <BarChart data={donutData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
            <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
            <Bar dataKey="value" name="ניתוחים" radius={[0, 6, 6, 0]} barSize={24}>
              {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div ref={ref} dir="rtl" style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={donutData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2} labelLine={false} label={false}>
            {donutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 22, fontWeight: 700, fill: '#1a1a1a' }}>{total}</text>
          <text x="50%" y="45%" dy={22} textAnchor="middle" style={{ fontSize: 10, fill: '#888' }}>ניתוחים</text>
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => {
              const item = donutData.find(d => d.name === value);
              return `${value} (${item?.value || 0})`;
            }}
            wrapperStyle={{ fontSize: 11, direction: 'rtl', paddingTop: 4 }}
          />
          <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} formatter={(v) => [v, 'ניתוחים']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default AttendingResidentChart;
