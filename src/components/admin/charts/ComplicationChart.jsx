'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const FONT = 'Heebo, sans-serif';

const ComplicationChart = forwardRef(function ComplicationChart({ surgeries, selectedMonth, selectedYear }, ref) {
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }),
  }));

  const { data, total, withComps } = useMemo(() => {
    const filtered = surgeries.filter(s => {
      if (!s.surgery_date) return false;
      const d = new Date(s.surgery_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const withComps = filtered.filter(s => s.complications && s.complications.length > 0).length;
    const withoutComps = filtered.length - withComps;
    return {
      data: [
        { name: 'ללא סיבוכים', value: withoutComps },
        { name: 'עם סיבוכים', value: withComps },
      ],
      total: filtered.length,
      withComps,
    };
  }, [surgeries, selectedMonth, selectedYear]);

  if (total === 0) {
    return <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  const pct = Math.round((withComps / total) * 100);

  const option = {
    textStyle: { fontFamily: FONT },
    tooltip: { trigger: 'item', textStyle: { fontFamily: FONT }, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, fontFamily: FONT }, icon: 'circle', itemWidth: 10, itemHeight: 10 },
    graphic: [
      { type: 'text', left: 'center', top: '34%', style: { text: String(total), fontSize: 26, fontWeight: 700, fontFamily: FONT, fill: '#1a1a1a', textAlign: 'center' } },
      { type: 'text', left: 'center', top: '46%', style: { text: 'ניתוחים', fontSize: 11, fontFamily: FONT, fill: '#999', textAlign: 'center' } },
      { type: 'text', left: 'center', top: '54%', style: { text: `${pct}% סיבוכים`, fontSize: 12, fontWeight: 600, fontFamily: FONT, fill: withComps > 0 ? '#E24B4A' : '#1D9E75', textAlign: 'center' } },
    ],
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '45%'],
      padAngle: 2,
      label: { show: false },
      data: [
        { name: 'ללא סיבוכים', value: data[0].value, itemStyle: { color: '#1D9E75' } },
        { name: 'עם סיבוכים', value: data[1].value, itemStyle: { color: '#E24B4A' } },
      ],
    }],
    animationDuration: 600,
  };

  return <ReactECharts ref={chartRef} option={option} style={{ height: 300, width: '100%' }} opts={{ renderer: 'canvas' }} />;
});

export default ComplicationChart;
