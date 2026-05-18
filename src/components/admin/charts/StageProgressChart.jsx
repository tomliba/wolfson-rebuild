'use client';

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { SURGERY_STEPS } from '@/components/shared/SurgerySteps';

const FONT = 'Heebo, sans-serif';

function barColor(count) {
  if (count === 0) return '#e5e7eb';
  if (count <= 3) return '#B5D4F4';
  if (count <= 6) return '#378ADD';
  return '#185FA5';
}

const StageProgressChart = forwardRef(function StageProgressChart({ surgeries, residents, chartType }, ref) {
  const chartRef = useRef(null);
  const htmlRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getDataURL: () => chartType === 'heatmap'
      ? chartRef.current?.getEchartsInstance()?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
      : null,
    isHTML: chartType !== 'heatmap',
    el: htmlRef.current,
  }));

  const data = useMemo(() => residents.map(r => {
    const residentSurgeries = surgeries.filter(s => s.resident_email === r.email);
    const stepCounts = {};
    let doneCount = 0;
    SURGERY_STEPS.forEach(step => {
      const count = residentSurgeries.filter(s => s.steps_performed?.includes(step.id)).length;
      stepCounts[step.id] = count;
      if (count > 0) doneCount++;
    });
    return { name: r.full_name || r.email, stepCounts, doneCount };
  }), [surgeries, residents]);

  if (chartType === 'heatmap') {
    const names = data.map(r => r.name);
    const stepLabels = SURGERY_STEPS.map(s => s.label);
    const heatData = [];
    let maxVal = 0;
    data.forEach((r, yIdx) => {
      SURGERY_STEPS.forEach((step, xIdx) => {
        const count = r.stepCounts[step.id];
        heatData.push([xIdx, yIdx, count]);
        if (count > maxVal) maxVal = count;
      });
    });

    const option = {
      textStyle: { fontFamily: FONT },
      tooltip: { position: 'top', textStyle: { fontFamily: FONT }, formatter: (p) => `${names[p.value[1]]} | ${stepLabels[p.value[0]]}: ${p.value[2]}` },
      grid: { top: 50, right: 10, bottom: 50, left: 10, containLabel: true },
      xAxis: { type: 'category', data: stepLabels, position: 'top', axisLabel: { fontSize: 9, fontFamily: FONT, rotate: 30 }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
      yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11, fontFamily: FONT }, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: true } },
      visualMap: { min: 0, max: Math.max(maxVal, 1), calculable: false, orient: 'horizontal', left: 'center', bottom: 4, inRange: { color: ['#f0f4f8', '#B5D4F4', '#378ADD', '#185FA5'] }, textStyle: { fontFamily: FONT, fontSize: 10 }, itemWidth: 12, itemHeight: 80 },
      series: [{ type: 'heatmap', data: heatData, label: { show: true, fontSize: 10, fontWeight: 600, fontFamily: FONT, formatter: (p) => p.value[2] > 0 ? String(p.value[2]) : '' }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 } }],
      animationDuration: 600,
    };

    return <ReactECharts ref={chartRef} option={option} style={{ height: Math.max(300, data.length * 36 + 100), width: '100%' }} opts={{ renderer: 'canvas' }} />;
  }

  return (
    <div ref={htmlRef} dir="rtl" className="space-y-3 p-3" style={{ fontFamily: FONT }}>
      {data.map(r => (
        <div key={r.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">{r.name}</span>
            <span className="text-xs font-medium text-muted-foreground">{r.doneCount}/{SURGERY_STEPS.length}</span>
          </div>
          <div className="flex gap-0.5 h-6 rounded-md overflow-hidden">
            {SURGERY_STEPS.map(step => {
              const count = r.stepCounts[step.id];
              return (
                <div key={step.id} className="flex-1 flex items-center justify-center text-[9px] font-bold transition-colors" style={{ backgroundColor: barColor(count), color: count > 3 ? '#fff' : count > 0 ? '#1e3a5f' : '#bbb' }} title={`${step.label}: ${count}`}>
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex gap-0.5 pt-1">
        {SURGERY_STEPS.map(step => (
          <div key={step.id} className="flex-1 text-center text-[8px] text-muted-foreground leading-tight">{step.label}</div>
        ))}
      </div>
    </div>
  );
});

export default StageProgressChart;
