import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'warning' | 'emerald';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100',
    highlight: 'bg-slate-900 text-white border-2 border-emerald-500/60 shadow-xl shadow-slate-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 text-amber-950 dark:text-amber-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-950 dark:text-emerald-100',
  };

  return (
    <div className={cn('rounded-2xl p-5 md:p-6 transition-all', variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
