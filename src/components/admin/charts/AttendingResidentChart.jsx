'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const GREEN_COLORS = ['#1D9E75','#0F6E56','#5DCAA5','#9FE1CB','#3ba272','#085041','#2AB88A','#16835F'];
const FONT = 'Heebo, sans-serif';

const AttendingResidentChart = forwardRef(function AttendingResidentChart({ surgeries, residents, selectedMonth, selectedYear, chartType, showTop3 }, ref) {
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }),
  }));

  const filtered = useMemo(() => surgeries.filter(s => {
    if (!s.surgery_date) return false;
    const d = new Date(s.surgery_date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  }), [surgeries, selectedMonth, selectedYear]);

  const supervisors = useMemo(() => [...new Set(filtered.map(s => s.supervising_surgeon).filter(Boolean))], [filtered]);

  const donutData = useMemo(() => {
    let d = supervisors.map(sup => ({
      name: sup,
      value: filtered.filter(s => s.supervising_surgeon === sup).length,
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    if (showTop3 && d.length > 3) {
      const top3 = d.slice(0, 3);
      const rest = d.slice(3).reduce((sum, i) => sum + i.value, 0);
      d = [...top3, { name: 'אחרים', value: rest }];
    }
    return d;
  }, [supervisors, filtered, showTop3]);

  const total = donutData.reduce((s, d) => s + d.value, 0);

  if (donutData.length === 0 && chartType !== 'heatmap') {
    return <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">אין נתונים</div>;
  }

  if (chartType === 'heatmap') {
    const sortedSups = [...supervisors].sort();
    const residentNames = residents.map(r => r.full_name || r.email);
    const heatData = [];
    let maxVal = 0;
    sortedSups.forEach((sup, yIdx) => {
      residents.forEach((r, xIdx) => {
        const count = filtered.filter(s => s.supervising_surgeon === sup && s.resident_email === r.email).length;
        heatData.push([xIdx, yIdx, count]);
        if (count > maxVal) maxVal = count;
      });
    });

    if (sortedSups.length === 0) {
      return <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">אין נתונים</div>;
    }

    const option = {
      textStyle: { fontFamily: FONT },
      tooltip: { position: 'top', textStyle: { fontFamily: FONT }, formatter: (p) => `${sortedSups[p.value[1]]} | ${residentNames[p.value[0]]}: ${p.value[2]}` },
      grid: { top: 50, right: 10, bottom: 50, left: 10, containLabel: true },
      xAxis: { type: 'category', data: residentNames, position: 'top', axisLabel: { fontSize: 10, fontFamily: FONT, rotate: 30 }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
      yAxis: { type: 'category', data: sortedSups, axisLabel: { fontSize: 11, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
      visualMap: { min: 0, max: Math.max(maxVal, 1), calculable: false, orient: 'horizontal', left: 'center', bottom: 4, inRange: { color: ['#f0f8f4', '#9FE1CB', '#1D9E75', '#085041'] }, textStyle: { fontFamily: FONT, fontSize: 10 }, itemWidth: 12, itemHeight: 80 },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, fontSize: 11, fontWeight: 600, fontFamily: FONT, formatter: (p) => p.value[2] > 0 ? String(p.value[2]) : '' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 } }],
      animationDuration: 600,
    };

    return <ReactECharts ref={chartRef} option={option} style={{ height: Math.max(280, sortedSups.length * 36 + 100), width: '100%' }} opts={{ renderer: 'canvas' }} />;
  }

  if (chartType === 'bar') {
    const option = {
      textStyle: { fontFamily: FONT },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontFamily: FONT } },
      grid: { top: 10, right: 40, bottom: 10, left: 10, containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'category', data: [...donutData].reverse().map(d => d.name), axisLabel: { fontSize: 12, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{
        type: 'bar',
        data: [...donutData].reverse().map((d, i) => ({ value: d.value, itemStyle: { color: GREEN_COLORS[(donutData.length - 1 - i) % GREEN_COLORS.length], borderRadius: [0, 6, 6, 0] } })),
        barWidth: 22,
        label: { show: true, position: 'right', fontSize: 13, fontWeight: 600, fontFamily: FONT },
      }],
      animationDuration: 600,
    };
    return <ReactECharts ref={chartRef} option={option} style={{ height: Math.max(250, donutData.length * 44), width: '100%' }} opts={{ renderer: 'canvas' }} />;
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
      data: donutData.map((d, i) => ({ name: d.name, value: d.value, itemStyle: { color: GREEN_COLORS[i % GREEN_COLORS.length] } })),
    }],
    animationDuration: 600,
  };

  return <ReactECharts ref={chartRef} option={option} style={{ height: 300, width: '100%' }} opts={{ renderer: 'canvas' }} />;
});

export default AttendingResidentChart;
