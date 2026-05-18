'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'];
const FONT = 'Heebo, sans-serif';

const MonthlyHeatmap = forwardRef(function MonthlyHeatmap({ surgeries, residents, selectedYear }, ref) {
  const chartRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' }),
  }));

  const { names, heatData, maxVal } = useMemo(() => {
    const sortedResidents = [...residents].sort((a, b) =>
      (a.full_name || a.email).localeCompare(b.full_name || b.email, 'he')
    );
    const names = sortedResidents.map(r => r.full_name || r.email);
    const heatData = [];
    let maxVal = 0;
    sortedResidents.forEach((r, yIdx) => {
      MONTHS.forEach((_, xIdx) => {
        const count = surgeries.filter(s => {
          if (s.resident_email !== r.email || !s.surgery_date) return false;
          const d = new Date(s.surgery_date);
          return d.getMonth() === xIdx && d.getFullYear() === selectedYear;
        }).length;
        heatData.push([xIdx, yIdx, count]);
        if (count > maxVal) maxVal = count;
      });
    });
    return { names, heatData, maxVal };
  }, [surgeries, residents, selectedYear]);

  const option = {
    textStyle: { fontFamily: FONT },
    tooltip: {
      position: 'top',
      textStyle: { fontFamily: FONT },
      formatter: (p) => `${names[p.value[1]]} | ${MONTHS[p.value[0]]}: ${p.value[2]}`,
    },
    grid: { top: 30, right: 10, bottom: 50, left: 10, containLabel: true },
    xAxis: { type: 'category', data: MONTHS, position: 'top', axisLabel: { fontSize: 11, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: Math.max(maxVal, 1),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 4,
      inRange: { color: ['#f0f4f8', '#B5D4F4', '#378ADD', '#185FA5'] },
      textStyle: { fontFamily: FONT, fontSize: 10 },
      itemWidth: 12,
      itemHeight: 80,
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: { show: true, fontSize: 11, fontWeight: 600, fontFamily: FONT, formatter: (p) => p.value[2] > 0 ? String(p.value[2]) : '' },
      emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } },
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
    }],
    animationDuration: 600,
  };

  return <ReactECharts ref={chartRef} option={option} style={{ height: Math.max(280, residents.length * 36 + 80), width: '100%' }} opts={{ renderer: 'canvas' }} />;
});

export default MonthlyHeatmap;
