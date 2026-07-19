import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trendText?: string;
  trendUp?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-slate-50',
  iconColor = 'text-slate-600',
  trendText,
  trendUp,
}: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-[13px] font-bold text-slate-500">{title}</span>
        {icon && (
          <div className={`p-2.5 ${iconBg} ${iconColor} rounded-xl`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-lg sm:text-2xl font-black text-slate-800 font-mono">
          {value}
        </h3>
        {trendText && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span>{trendUp ? '↑' : '↓'} {trendText}</span>
          </p>
        )}
        {subtitle && !trendText && (
          <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
