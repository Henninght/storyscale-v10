import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricsCard({ title, value, icon: Icon, description, trend }: MetricsCardProps) {
  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-secondary/80">{title}</h3>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mb-1 text-3xl font-bold text-secondary">{value}</div>
      <p className="text-sm text-secondary/60">{description}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-secondary/60">vs last month</span>
        </div>
      )}
    </div>
  );
}
