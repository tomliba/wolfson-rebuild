'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#639922','#5F5E5A','#85B7EB','#5DCAA5','#F0997B','#AFA9EC','#ED93B1','#97C459'];
const FONT = 'Heebo, sans-serif';

const ResidentCountChart = forwardRef(function ResidentCountChart({ surgeries, residents, selectedMonth, selectedYear, chartType, showTop3 }, ref) {
  const filtered = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  let data = residents.map(r => ({
    name: r.full_name || r.email,
    value: filtered.filter(s => s.resident_email === r.email).length,
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  if (showTop3 && data.length > 3) {
    const top3 = data.slice(0, 3);
    const rest = data.slice(3).reduce((sum, d) => sum + d.value, 0);
    data = [...top3, { name: 'אחרים', value: rest }];
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return <div ref={ref} className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  if (chartType === 'bar') {
    return (
      <div ref={ref} dir="rtl" className="space-y-2 p-3" style={{ fontFamily: FONT }}>
        {data.map((d, i) => (
          <div key={d.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{d.name}</span>
              <span className="text-xs font-bold">{d.value}</span>
            </div>
            <div className="h-5 rounded-md overflow-hidden bg-muted/40">
              <div
                className="h-full rounded-md transition-all"
                style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (chartType === 'dots') {
    return (
      <div ref={ref} dir="rtl" className="space-y-2.5 p-3" style={{ fontFamily: FONT }}>
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="text-xs font-medium w-20 text-right shrink-0 truncate">{d.name}</span>
            <div className="flex gap-1 flex-wrap flex-1">
              {Array.from({ length: d.value }).map((_, j) => (
                <div key={j} className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground mr-1">{d.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} dir="rtl" style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2} labelLine={false} label={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <text x="50%" y="42%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 24, fontWeight: 700, fill: '#1a1a1a', fontFamily: FONT }}>{total}</text>
          <text x="50%" y="52%" textAnchor="middle" style={{ fontSize: 11, fill: '#888', fontFamily: FONT }}>ניתוחים</text>
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            iconSize={10}
            formatter={(value) => {
              const item = data.find(d => d.name === value);
              return `${value} (${item?.value || 0})`;
            }}
            wrapperStyle={{ fontSize: 12, fontFamily: FONT, direction: 'rtl', paddingTop: 4 }}
          />
          <Tooltip contentStyle={{ direction: 'rtl', fontSize: 13, fontFamily: FONT }} formatter={(v) => [v, 'ניתוחים']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ResidentCountChart;
