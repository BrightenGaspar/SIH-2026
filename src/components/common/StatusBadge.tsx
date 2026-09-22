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
      case 'completed':
      case 'fulfilled':
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
      case 'in_transit':
      case 'in transit':
      case 'picked_up':
      case 'pickup_assigned':
      case 'logistics_accepted':
      case 'pickup':
      case 'consolidating':
      case 'medium':
      case 'moderate':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
      case 'accepted':
      case 'confirmed':
      case 'new':
      case 'pending':
      case 'escrow locked':
      case 'open':
      case 'high':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-500/30';
      case 'preparing':
      case 'reserved':
        return 'bg-purple-50 dark:bg-purple-500/10 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-500/30';
      case 'ready_for_pickup':
      case 'ready to deliver':
      case 'ready_to_deliver':
      case 'dispatch_offered':
      case 'dispatch offered':
        return 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30';
      case 'sold':
      case 'sold out':
      case 'out of stock':
      case 'rejected':
      case 'cancelled':
      case 'failed_delivery':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/30';
      case 'expired':
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-500/30';
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
