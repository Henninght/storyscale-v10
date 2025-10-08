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
  // Color-coded icon backgrounds based on title
  const getIconColor = () => {
    if (title.includes('Posts') || title.includes('Remaining')) return { bg: 'bg-orange-100', text: 'text-orange-600' };
    if (title.includes('Drafts') || title.includes('Progress')) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (title.includes('Ready')) return { bg: 'bg-green-100', text: 'text-green-600' };
    if (title.includes('Campaigns') || title.includes('Active')) return { bg: 'bg-purple-100', text: 'text-purple-600' };
    if (title.includes('Total')) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (title.includes('Archived')) return { bg: 'bg-slate-100', text: 'text-slate-600' };
    return { bg: 'bg-orange-100', text: 'text-orange-600' };
  };

  const iconColor = getIconColor();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover-lift">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className={`rounded-lg ${iconColor.bg} p-2`}>
          <Icon className={`h-5 w-5 ${iconColor.text}`} />
        </div>
      </div>
      <div className="mb-1 text-3xl font-bold text-slate-800">{value}</div>
      <p className="text-sm text-slate-600">{description}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-slate-600">vs last month</span>
        </div>
      )}
    </div>
  );
}
