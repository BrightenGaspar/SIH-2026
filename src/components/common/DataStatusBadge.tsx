'use client';

import React from 'react';
import { Radio, Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

export type DataFreshnessStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'NO_DATA';

export interface DataStatusBadgeProps {
  status?: DataFreshnessStatus;
  lastUpdated?: string | Date | null;
  source?: string | null;
  freshnessThresholdMinutes?: number;
  showSource?: boolean;
  showTimestamp?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function computeDataFreshness(
  lastUpdated?: string | Date | null,
  freshnessThresholdMinutes: number = 3,
  isSourceOnline: boolean = true
): DataFreshnessStatus {
  if (!lastUpdated) return 'NO_DATA';
  if (!isSourceOnline) return 'OFFLINE';

  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) return 'LIVE';

  const diffMinutes = diffMs / (1000 * 60);
  if (diffMinutes <= freshnessThresholdMinutes) {
    return 'LIVE';
  }
  return 'STALE';
}

export function formatTimeAgo(lastUpdated: string | Date): string {
  const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function DataStatusBadge({
  status,
  lastUpdated,
  source,
  freshnessThresholdMinutes = 3,
  showSource = false,
  showTimestamp = false,
  size = 'sm',
  className,
}: DataStatusBadgeProps) {
  const { t } = useI18n();

  // Compute status if not explicitly passed
  const activeStatus = status || computeDataFreshness(lastUpdated, freshnessThresholdMinutes);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  const timeAgoStr = lastUpdated ? formatTimeAgo(lastUpdated) : '';

  let config = {
    label: t('statusLive') || 'LIVE',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    pulse: true,
    icon: Radio,
  };

  switch (activeStatus) {
    case 'LIVE':
      config = {
        label: t('statusLive') || 'LIVE',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        pulse: true,
        icon: Radio,
      };
      break;
    case 'STALE':
      config = {
        label: `${t('statusStale') || 'STALE'}${timeAgoStr ? ` (${timeAgoStr})` : ''}`,
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        dotColor: 'bg-amber-500',
        pulse: false,
        icon: Clock,
      };
      break;
    case 'OFFLINE':
      config = {
        label: t('statusOffline') || 'OFFLINE',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        dotColor: 'bg-rose-500',
        pulse: false,
        icon: WifiOff,
      };
      break;
    case 'NO_DATA':
    default:
      config = {
        label: t('statusNoData') || 'NO DATA',
        color: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30',
        dotColor: 'bg-slate-400',
        pulse: false,
        icon: AlertCircle,
      };
      break;
  }

  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center', className)}>
      <span
        className={cn(
          'inline-flex items-center rounded-full font-bold border tracking-wide uppercase',
          sizeClasses[size],
          config.color
        )}
      >
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                config.dotColor
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', config.dotColor)}
          />
        </span>
        <span>{config.label}</span>
      </span>

      {showSource && source && (
        <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          Source: {source}
        </span>
      )}

      {showTimestamp && lastUpdated && activeStatus !== 'STALE' && (
        <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500">
          {timeAgoStr}
        </span>
      )}
    </div>
  );
}
