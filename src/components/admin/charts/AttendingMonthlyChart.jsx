'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  })).sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (chartType === 'bar') {
    return (
      <div ref={ref} dir="rtl" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
            <Bar dataKey="value" name="ניתוחים" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} style={{ fontSize: 10 }}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Legend formatter={(value) => {
            const item = data.find(d => d.name === value);
            return `${value}: ${item?.value || 0} (${total ? ((item?.value / total) * 100).toFixed(0) : 0}%)`;
          }} wrapperStyle={{ fontSize: 11, direction: 'rtl' }} />
          <Tooltip contentStyle={{ direction: 'rtl', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default AttendingMonthlyChart;
