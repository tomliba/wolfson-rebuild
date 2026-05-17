'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#639922','#5F5E5A','#85B7EB','#5DCAA5','#F0997B','#AFA9EC','#ED93B1','#97C459'];

const AttendingMonthlyChart = forwardRef(function AttendingMonthlyChart({ surgeries, selectedMonth, selectedYear, chartType }, ref) {
  const filtered = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const supervisors = [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))];
  const data = supervisors.map(sup => ({
    name: sup,
    value: filtered.filter(s => s.supervising_surgeon === sup).length,
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return <div ref={ref} className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  if (chartType === 'bar') {
    return (
      <div ref={ref} dir="rtl" style={{ width: '100%', height: Math.max(200, data.length * 40 + 40) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
            <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
            <Bar dataKey="value" name="ניתוחים" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <Pie data={data} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2} labelLine={false} label={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
              const item = data.find(d => d.name === value);
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

export default AttendingMonthlyChart;
