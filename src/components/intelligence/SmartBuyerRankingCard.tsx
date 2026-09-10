'use client';

import React from 'react';
import { BuyerMatchResult } from '@/types/intelligence';
import { Building2, Star, CheckCircle, Truck, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartBuyerRankingCardProps {
  buyers: BuyerMatchResult[];
  onSelectBuyer?: (buyer: BuyerMatchResult) => void;
  className?: string;
}

export function SmartBuyerRankingCard({ buyers, onSelectBuyer, className }: SmartBuyerRankingCardProps) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4', className)}>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2'>
            <Building2 className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
            Direct Buyer Matching & Net Realization
          </h3>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            Ranked by Net Farmer Realization (after deducting farm-gate pickup & freight logistics)
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        {buyers.map((item, idx) => {
          const { buyer, compositeScore, netFarmerRealizationPerKg, isBestMatch, matchHighlights } = item;
          return (
            <div
              key={buyer.id}
              className={cn(
                'p-4 rounded-xl border transition-all',
                isBestMatch
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              )}
            >
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-bold text-sm text-slate-900 dark:text-white'>{buyer.name}</span>
                    <span className='text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold'>
                      {buyer.buyerType}
                    </span>
                    {buyer.verifiedBuyer && (
                      <span className='text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-0.5'>
                        <ShieldCheck className='w-3 h-3' /> Verified
                      </span>
                    )}
                    {isBestMatch && (
                      <span className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold'>
                        ★ Top Recommendation
                      </span>
                    )}
                  </div>

                  <div className='flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                    <span>{buyer.destinationHub}</span>
                    <span>&bull;</span>
                    <span>{buyer.distanceKm} km away</span>
                    <span>&bull;</span>
                    <span className='flex items-center gap-1 text-amber-500 font-bold'>
                      <Star className='w-3 h-3 fill-amber-400' /> {buyer.reliabilityRating.toFixed(1)}
                    </span>
                  </div>

                  <div className='flex flex-wrap gap-1.5 pt-1'>
                    {matchHighlights.map((hl, i) => (
                      <span key={i} className='text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700'>
                        ✓ {hl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700 gap-2 shrink-0'>
                  <div>
                    <span className='text-[10px] text-slate-400 block sm:text-right'>Net Farmer Realization</span>
                    <div className='text-right'>
                      <span className='text-lg font-black text-emerald-600 dark:text-emerald-400'>
                        ₹{netFarmerRealizationPerKg.toFixed(2)}
                      </span>
                      <span className='text-xs text-slate-400 font-semibold'> / kg</span>
                    </div>
                    <span className='text-[10px] text-slate-400 block sm:text-right'>Gross: ₹{buyer.offeredPricePerKg}/kg</span>
                  </div>

                  <button
                    type='button'
                    onClick={() => onSelectBuyer && onSelectBuyer(item)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm',
                      isBestMatch
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900'
                    )}
                  >
                    Select Buyer <ArrowRight className='w-3 h-3' />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
