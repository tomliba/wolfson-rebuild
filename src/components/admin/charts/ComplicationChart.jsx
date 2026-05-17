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

  if (total === 0) {
    return <div ref={ref} className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  return (
    <div ref={ref} dir="rtl" style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="45%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2} labelLine={false} label={false}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
          <text x="50%" y="40%" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 22, fontWeight: 700, fill: '#1a1a1a' }}>{total}</text>
          <text x="50%" y="40%" dy={22} textAnchor="middle" style={{ fontSize: 10, fill: '#888' }}>ניתוחים</text>
          <text x="50%" y="40%" dy={38} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: withComps > 0 ? '#E24B4A' : '#1D9E75' }}>
            {total > 0 ? `${Math.round((withComps / total) * 100)}% סיבוכים` : ''}
          </text>
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

export default ComplicationChart;
