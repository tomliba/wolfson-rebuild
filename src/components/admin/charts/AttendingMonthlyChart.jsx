'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const GREEN_COLORS = ['#1D9E75','#0F6E56','#5DCAA5','#9FE1CB','#3ba272','#085041','#2AB88A','#16835F'];
const FONT = 'Heebo, sans-serif';

const AttendingMonthlyChart = forwardRef(function AttendingMonthlyChart({ surgeries, selectedMonth, selectedYear, chartType }, ref) {
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }),
  }));

  const filtered = useMemo(() => surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [surgeries, selectedMonth, selectedYear]);

  const data = useMemo(() => {
    const supervisors = [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))];
    return supervisors.map(sup => ({
      name: sup,
      value: filtered.filter(s => s.supervising_surgeon === sup).length,
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">אין נתונים</div>;
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
        data: [...data].reverse().map((d, i) => ({ value: d.value, itemStyle: { color: GREEN_COLORS[(data.length - 1 - i) % GREEN_COLORS.length], borderRadius: [0, 6, 6, 0] } })),
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
      data: data.map((d, i) => ({ name: d.name, value: d.value, itemStyle: { color: GREEN_COLORS[i % GREEN_COLORS.length] } })),
    }],
    animationDuration: 600,
  };

  return <ReactECharts ref={chartRef} option={option} style={{ height: 300, width: '100%' }} opts={{ renderer: 'canvas' }} />;
});

export default AttendingMonthlyChart;
