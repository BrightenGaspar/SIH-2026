'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react';
import { UnifiedIntelligencePipelineResult } from '@/types/intelligence';
import { cn } from '@/lib/utils';

interface DecisionSummaryHeroProps {
  data: UnifiedIntelligencePipelineResult;
  onOpenQualityModal?: () => void;
  className?: string;
}

export function DecisionSummaryHero({ data, onOpenQualityModal, className }: DecisionSummaryHeroProps) {
  const { 
    commodity, 
    harvestOverview, 
    weatherShock, 
    pricing, 
    profitability, 
    topBuyer, 
    destinationMarkets, 
    storageAdvice 
  } = data;

  const topMandi = destinationMarkets[0];

  return (
    <div className={cn('bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 relative overflow-hidden', className)}>
      {/* Background glow accents */}
      <div className='absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none' />

      <div className='relative z-10 space-y-6'>
        
        {/* Top Header Pill & Status */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/40 pb-4'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div>
              <span className='text-xs font-bold uppercase tracking-wider text-emerald-400 block'>
                Unified Agricultural Decision Engine
              </span>
              <h1 className='text-xl sm:text-2xl font-black tracking-tight text-white'>
                {commodity} - Strategic Market Intelligence
              </h1>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30'>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
              Dynamic Math Verified
            </span>
            {onOpenQualityModal && (
              <button
                type='button'
                onClick={onOpenQualityModal}
                className='px-3 py-1 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition'
              >
                Inspect Crop Quality (CV)
              </button>
            )}
          </div>
        </div>

        {/* Hero Pricing & Shock Matrix */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-6 items-center'>
          
          {/* Main Price Box (6 cols) */}
          <div className='md:col-span-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 space-y-3'>
            <span className='text-xs uppercase font-bold text-emerald-300 tracking-wider block'>
              Dynamic Predicted Selling Price
            </span>

            <div className='flex items-baseline gap-2.5'>
              <span className='text-4xl sm:text-5xl font-black tracking-tight text-white'>
                ₹{weatherShock.safetyClampedPredictedPrice.toFixed(2)}
              </span>
              <span className='text-emerald-300 font-bold text-base'>/ kg</span>
              <span className='ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
                {weatherShock.shockMultiplier}x Shock Multiplier
              </span>
            </div>

            <div className='flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-white/10'>
              <div>
                <span className='text-slate-400 block text-[11px]'>Minimum Sustainable Price:</span>
                <span className='font-extrabold text-white text-sm'>
                  ₹{weatherShock.minimumSustainablePrice.toFixed(2)} / kg
                </span>
              </div>
              <div className='h-6 w-px bg-white/10 hidden sm:block' />
              <div>
                <span className='text-slate-400 block text-[11px]'>Recommended Selling Range:</span>
                <span className='font-extrabold text-emerald-400 text-sm'>
                  ₹{weatherShock.recommendedSellingRange.min.toFixed(2)} - ₹{weatherShock.recommendedSellingRange.max.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Decision Snapshot (6 cols) */}
          <div className='md:col-span-6 grid grid-cols-2 gap-3 text-xs'>
            
            <div className='bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-1'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Net Farmer Profit</span>
              <span className='text-xl font-black text-emerald-400 block'>
                +₹{profitability.netProfit.toLocaleString()}
              </span>
              <span className='text-[11px] text-emerald-300/80'>Margin: {profitability.profitMarginPercent}% ({profitability.marginHealth})</span>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-1'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Market Shortage %</span>
              <span className='text-xl font-black text-amber-400 block'>
                {weatherShock.marketShortagePercent}% Shortage
              </span>
              <span className='text-[11px] text-slate-400'>Damage: {weatherShock.damageRatePercent}% ({harvestOverview.damagedKg}kg lost)</span>
            </div>

            <div className='bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-1 col-span-2'>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] text-slate-400 uppercase font-semibold'>Recommended Action</span>
                <span className='px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]'>
                  {storageAdvice.action.replace('_', ' ')}
                </span>
              </div>
              <p className='text-[11px] text-slate-300 line-clamp-2 mt-0.5'>
                {storageAdvice.reasoning}
              </p>
            </div>

          </div>

        </div>

        {/* Action Pathway Cards: Best Buyer & Best Mandi */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'>
          
          {/* Top Matched Buyer */}
          <div className='bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-500/30 flex flex-col justify-between space-y-3'>
            <div>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1'>
                  <Building2 className='w-3.5 h-3.5' /> Optimal Matched Buyer
                </span>
                <span className='text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200'>
                  {topBuyer.compositeScore}% Match
                </span>
              </div>
              <h3 className='text-base font-bold text-white mt-1'>{topBuyer.buyer.name}</h3>
              <p className='text-xs text-slate-400'>{topBuyer.buyer.destinationHub}</p>
            </div>

            <div className='flex items-center justify-between border-t border-white/10 pt-3'>
              <div>
                <span className='text-[10px] text-slate-400 block'>Net Realization / kg</span>
                <span className='text-lg font-black text-emerald-400'>
                  ₹{topBuyer.netFarmerRealizationPerKg.toFixed(2)}
                </span>
              </div>
              <Link
                href='/farmer/orders'
                className='px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md'
              >
                Accept Direct Order <ArrowRight className='w-3.5 h-3.5' />
              </Link>
            </div>
          </div>

          {/* Top Destination Mandi */}
          <div className='bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between space-y-3'>
            <div>
              <div className='flex items-center justify-between'>
                <span className='text-[10px] uppercase font-bold text-teal-400 tracking-wider flex items-center gap-1'>
                  <Truck className='w-3.5 h-3.5' /> Optimal Mandi Destination
                </span>
                <span className='text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200'>
                  Rank #1 Mandi
                </span>
              </div>
              <h3 className='text-base font-bold text-white mt-1'>{topMandi.mandi.name}</h3>
              <p className='text-xs text-slate-400'>{topMandi.mandi.district}, {topMandi.mandi.state} ({topMandi.mandi.distanceKm} km)</p>
            </div>

            <div className='flex items-center justify-between border-t border-white/10 pt-3'>
              <div>
                <span className='text-[10px] text-slate-400 block'>Net Realization / kg</span>
                <span className='text-lg font-black text-teal-300'>
                  ₹{topMandi.netRealizationPerKg.toFixed(2)}
                </span>
              </div>
              <Link
                href='/farmer/orders'
                className='px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20'
              >
                Dispatch Reefer Fleet <ArrowRight className='w-3.5 h-3.5' />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
