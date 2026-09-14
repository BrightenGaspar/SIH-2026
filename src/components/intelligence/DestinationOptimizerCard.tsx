'use client';

import React from 'react';
import { DestinationOptimizationResult } from '@/types/intelligence';
import { MapPin, Navigation, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DestinationOptimizerCardProps {
  destinations: DestinationOptimizationResult[];
  className?: string;
}

export function DestinationOptimizerCard({ destinations, className }: DestinationOptimizerCardProps) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4', className)}>
      <div>
        <h3 className='text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2'>
          <Navigation className='w-4 h-4 text-teal-600 dark:text-teal-400' />
          Mandi Destination Net Realization Optimizer
        </h3>
        <p className='text-xs text-slate-500 dark:text-slate-400'>
          Ranked by true realization: Mandi Gross Price − (Freight + APMC Cess + Spoilage Transit Loss)
        </p>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs border-collapse'>
          <thead>
            <tr className='border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]'>
              <th className='py-2.5 px-3'>Rank & Mandi</th>
              <th className='py-2.5 px-3'>Distance</th>
              <th className='py-2.5 px-3'>Gross Mandi Price</th>
              <th className='py-2.5 px-3'>Freight & Handling</th>
              <th className='py-2.5 px-3'>Est. Spoilage %</th>
              <th className='py-2.5 px-3 text-right'>Net Farmer Realization</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 dark:divide-slate-800/60'>
            {destinations.map((item) => {
              const { mandi, netRealizationPerKg, rank, isRecommended, advantageOverLocalPerKg } = item;
              return (
                <tr 
                  key={mandi.id}
                  className={cn(
                    'transition-colors',
                    isRecommended ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  )}
                >
                  <td className='py-3 px-3'>
                    <div className='flex items-center gap-2'>
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                        rank === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      )}>
                        {rank}
                      </span>
                      <div>
                        <span className='font-bold text-slate-900 dark:text-white block'>{mandi.name}</span>
                        <span className='text-[10px] text-slate-400'>{mandi.district}, {mandi.state}</span>
                      </div>
                    </div>
                  </td>

                  <td className='py-3 px-3 text-slate-600 dark:text-slate-300 font-mono'>
                    {mandi.distanceKm} km
                  </td>

                  <td className='py-3 px-3 text-slate-700 dark:text-slate-200 font-bold'>
                    ₹{mandi.currentMandiPrice.toFixed(2)}/kg
                  </td>

                  <td className='py-3 px-3 text-slate-500 dark:text-slate-400'>
                    -₹{(mandi.freightRatePerKg + mandi.mandiCessAndHandlingPerKg).toFixed(2)}/kg
                  </td>

                  <td className='py-3 px-3 text-slate-500 dark:text-slate-400'>
                    {mandi.estimatedSpoilageTransitPercent}%
                  </td>

                  <td className='py-3 px-3 text-right'>
                    <span className={cn(
                      'text-sm font-black',
                      isRecommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                    )}>
                      ₹{netRealizationPerKg.toFixed(2)}/kg
                    </span>
                    {advantageOverLocalPerKg > 0 && (
                      <span className='text-[10px] text-emerald-600 dark:text-emerald-400 block font-normal'>
                        (+₹{advantageOverLocalPerKg.toFixed(2)} vs local)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
