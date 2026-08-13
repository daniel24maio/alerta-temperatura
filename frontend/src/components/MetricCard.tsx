import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  subtitle: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  colorClass = 'text-sky-400',
  icon,
}) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 flex flex-col gap-3 hover:border-sky-500/30 transition-all duration-200 hover:-translate-y-0.5 shadow-xl">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold font-mono ${colorClass}`}>{value}</span>
        <span className="text-slate-400 text-sm font-medium">{unit}</span>
      </div>

      <span className="text-xs text-slate-400 font-medium">{subtitle}</span>
    </div>
  );
};
