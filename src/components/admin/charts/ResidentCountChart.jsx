'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const COLORS = ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc','#5c7bd9','#6dce89','#f7b74a','#ef8181','#8fd4e8'];
const FONT = 'Heebo, sans-serif';

const ResidentCountChart = forwardRef(function ResidentCountChart({ surgeries, residents, selectedMonth, selectedYear, chartType, showTop3 }, ref) {
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }),
    isHTML: chartType === 'dots',
    el: chartType === 'dots' ? htmlRef.current : null,
  }));

  const htmlRef = useRef(null);

  const filtered = useMemo(() => surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [surgeries, selectedMonth, selectedYear]);

  let data = useMemo(() => {
    let d = residents.map(r => ({
      name: r.full_name || r.email,
      value: filtered.filter(s => s.resident_email === r.email).length,
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    if (showTop3 && d.length > 3) {
      const top3 = d.slice(0, 3);
      const rest = d.slice(3).reduce((sum, i) => sum + i.value, 0);
      d = [...top3, { name: 'אחרים', value: rest }];
    }
    return d;
  }, [residents, filtered, showTop3]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return <div ref={htmlRef} className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  if (chartType === 'dots') {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
      <div ref={htmlRef} dir="rtl" className="space-y-2.5 p-3" style={{ fontFamily: FONT }}>
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

  if (chartType === 'bar') {
    const option = {
      textStyle: { fontFamily: FONT },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontFamily: FONT } },
      grid: { top: 10, right: 40, bottom: 10, left: 10, containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: [...data].reverse().map(d => d.name), axisLabel: { fontSize: 12, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{
        type: 'bar',
        data: [...data].reverse().map((d, i) => ({ value: d.value, itemStyle: { color: COLORS[(data.length - 1 - i) % COLORS.length], borderRadius: [0, 6, 6, 0] } })),
        barWidth: 22,
        label: { show: true, position: 'right', fontSize: 13, fontWeight: 600, fontFamily: FONT },
      }],
      animationDuration: 600,
    };
    return <ReactECharts ref={chartRef} option={option} style={{ height: Math.max(250, data.length * 44), width: '100%' }} opts={{ renderer: 'canvas' }} />;
  }

  const option = {
    textStyle: { fontFamily: FONT },
    tooltip: { trigger: 'item', textStyle: { fontFamily: FONT }, formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11, fontFamily: FONT }, icon: 'circle', itemWidth: 10, itemHeight: 10 },
    graphic: [
      { type: 'text', left: 'center', top: '38%', style: { text: String(total), fontSize: 26, fontWeight: 700, fontFamily: FONT, fill: '#1a1a1a', textAlign: 'center' } },
      { type: 'text', left: 'center', top: '50%', style: { text: 'ניתוחים', fontSize: 11, fontFamily: FONT, fill: '#999', textAlign: 'center' } },
    ],
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      padAngle: 2,
      label: { show: false },
      data: data.map((d, i) => ({ name: d.name, value: d.value, itemStyle: { color: COLORS[i % COLORS.length] } })),
    }],
    animationDuration: 600,
  };

  return <ReactECharts ref={chartRef} option={option} style={{ height: 300, width: '100%' }} opts={{ renderer: 'canvas' }} />;
});

export default ResidentCountChart;
