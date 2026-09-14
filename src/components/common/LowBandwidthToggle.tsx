'use client';

import React from 'react';
import { useBandwidth } from '@/context/BandwidthContext';
import { Zap, ZapOff } from 'lucide-react';

export function LowBandwidthToggle() {
  const { isLowBandwidth, toggleLowBandwidth } = useBandwidth();

  return (
    <button
      onClick={toggleLowBandwidth}
      title={isLowBandwidth ? 'Low-Bandwidth Mode Active' : 'Switch to Low-Bandwidth Mode'}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition border ${
        isLowBandwidth
          ? 'bg-amber-500/10 text-amber-500 border-amber-500/40'
          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
      }`}
    >
      {isLowBandwidth ? <ZapOff className="w-3 h-3 text-amber-400" /> : <Zap className="w-3 h-3 text-amber-400" />}
      <span className="hidden sm:inline">{isLowBandwidth ? 'Low Bandwidth: ON' : 'Low Bandwidth'}</span>
      <span className="sm:hidden">{isLowBandwidth ? '2G ON' : '2G'}</span>
    </button>
  );
}
