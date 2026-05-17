import React from 'react';
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
    chart1: "bg-chart-1/10 text-chart-1",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}