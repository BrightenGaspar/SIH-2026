import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'warning' | 'emerald';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
    highlight: 'bg-gradient-to-b from-emerald-950/30 to-slate-900 border-2 border-emerald-500/40 shadow-md shadow-emerald-950/20',
    warning: 'bg-amber-950/20 border border-amber-600/40',
    emerald: 'bg-emerald-900/20 border border-emerald-600/40',
  };

  return (
    <div className={cn('rounded-2xl p-5 md:p-6 transition-all', variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
