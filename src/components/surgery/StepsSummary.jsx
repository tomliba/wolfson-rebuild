import React from 'react';
import { Card } from "@/components/ui/card";
import { SURGERY_STEPS } from "../shared/SurgerySteps";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StepsSummary({ surgeries }) {
  const stepCounts = SURGERY_STEPS.map(step => ({
    name: step.label,
    count: surgeries.filter(s => s.steps_performed?.includes(step.id)).length
  }));

  const maxCount = Math.max(...stepCounts.map(s => s.count), 1);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">סיכום שלבים שבוצעו</h3>
      <div className="space-y-2">
        {stepCounts.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32 shrink-0 text-left">{step.name}</span>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${(step.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-8 text-center">{step.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}