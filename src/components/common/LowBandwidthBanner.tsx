'use client';

import React from 'react';
import { useBandwidth } from '@/context/BandwidthContext';
import { Radio, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LowBandwidthBannerProps {
  role?: 'farmer' | 'consumer' | 'logistics';
  className?: string;
  forceShow?: boolean;
}

export function LowBandwidthBanner({
  role = 'farmer',
  className,
  forceShow = false,
}: LowBandwidthBannerProps) {
  const { isLowBandwidth, setLowBandwidth } = useBandwidth();

  // If not in low bandwidth mode and not forced, do not render
  if (!isLowBandwidth && !forceShow) return null;

  const bgStyles =
    role === 'farmer'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : role === 'consumer'
      ? 'bg-blue-50 border-blue-200 text-blue-900'
      : 'bg-amber-50 border-amber-200 text-amber-900';

  const iconStyles =
    role === 'farmer'
      ? 'text-emerald-600 bg-emerald-100'
      : role === 'consumer'
      ? 'text-blue-600 bg-blue-100'
      : 'text-amber-600 bg-amber-100';

  const actionColor =
    role === 'farmer'
      ? 'text-emerald-700 hover:text-emerald-900'
      : role === 'consumer'
      ? 'text-blue-700 hover:text-blue-900'
      : 'text-amber-700 hover:text-amber-900';

  return (
    <div
      className={cn(
        'w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs transition-all',
        bgStyles,
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', iconStyles)}>
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase">Low Bandwidth Mode</span>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-bold border border-current/20">
              Active
            </span>
          </div>
          <p className="text-xs opacity-80 truncate font-medium">Less data • Faster loading</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLowBandwidth(!isLowBandwidth)}
        className={cn('text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-white/60', actionColor)}
      >
        <span>{isLowBandwidth ? 'Switch to Normal' : 'Enable'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
