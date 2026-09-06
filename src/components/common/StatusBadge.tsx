import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
      case 'fulfilled':
      case 'low':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'in transit':
      case 'pickup':
      case 'consolidating':
      case 'medium':
      case 'moderate':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'confirmed':
      case 'open':
      case 'high':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'reserved':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'sold':
      case 'expired':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border',
      size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
      getColors()
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
