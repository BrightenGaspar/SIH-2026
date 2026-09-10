'use client';

import React from 'react';
import { FoodLossRiskResult } from '@/types/intelligence';
import { AlertOctagon, Clock, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FoodLossAlertCardProps {
  lossRisk: FoodLossRiskResult;
  onSelectChannel?: (channel: any) => void;
  className?: string;
}

export function FoodLossAlertCard({ lossRisk, onSelectChannel, className }: FoodLossAlertCardProps) {
  const isHighRisk = lossRisk.riskLevel === 'HIGH' || lossRisk.riskLevel === 'CRITICAL';

  return (
    <div className={cn(
      'rounded-2xl border p-5 shadow-sm space-y-4 transition-all',
      isHighRisk 
        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      className
    )}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2.5'>
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isHighRisk ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-600'
          )}>
            <AlertOctagon className='w-5 h-5' />
          </div>
          <div>
            <h3 className='text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2'>
              Zero-Loss Perishable Safeguard
              <span className={cn(
                'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full',
                isHighRisk ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              )}>
                {lossRisk.riskLevel} Risk
              </span>
            </h3>
            <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
              {lossRisk.urgentActionHeadline}
            </p>
          </div>
        </div>

        <div className='text-right shrink-0'>
          <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Remaining Window</span>
          <span className='text-sm font-black text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1'>
            <Clock className='w-3.5 h-3.5' /> {lossRisk.remainingShelfLifeHours} Hours
          </span>
        </div>
      </div>

      <div className='space-y-2 pt-1'>
        <span className='text-[11px] font-bold uppercase tracking-wider text-slate-400 block'>
          5-Path Emergency Rescue Alternatives
        </span>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs'>
          {lossRisk.recommendedRescueChannels.map((channel, i) => (
            <div 
              key={i} 
              className='p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2'
            >
              <div>
                <span className='text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block'>
                  {channel.type.replace('_', ' ')}
                </span>
                <span className='font-bold text-slate-800 dark:text-slate-200 block text-xs mt-0.5 line-clamp-1'>
                  {channel.partnerName}
                </span>
                <span className='text-[11px] text-slate-500 block mt-1'>
                  Salvage: ₹{channel.potentialSalvageValue.toLocaleString()} ({channel.offeredPricePerKg > 0 ? ₹/kg : 'Zero Waste Donation'})
                </span>
              </div>

              <button
                type='button'
                onClick={() => onSelectChannel && onSelectChannel(channel)}
                className='w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1'
              >
                Dispatch Channel <ArrowRight className='w-3 h-3' />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
