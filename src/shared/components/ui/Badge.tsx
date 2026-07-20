import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'blue';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const baseClasses = 'px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold inline-flex items-center gap-1';
  
  const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100',
    info: 'bg-sky-50 text-sky-600 border border-sky-100',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
