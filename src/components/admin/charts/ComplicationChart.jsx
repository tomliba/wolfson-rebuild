'use client';

import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const ComplicationChart = forwardRef(function ComplicationChart({ surgeries, selectedMonth, selectedYear }, ref) {
  const filtered = surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const withComps = filtered.filter(s => s.complications && s.complications.length > 0).length;
  const withoutComps = filtered.length - withComps;

  const data = [
    { name: 'ללא סיבוכים', value: withoutComps },
    { name: 'עם סיבוכים', value: withComps },
  ];

  const colors = ['#1D9E75', '#E24B4A'];
  const total = filtered.length;

  return (
    <div ref={ref} dir="rtl" style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => total > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''} labelLine={false} style={{ fontSize: 10 }}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
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

export default ComplicationChart;
