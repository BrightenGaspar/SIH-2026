'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CloudRain, 
  ArrowLeft, 
  Sliders, 
  HelpCircle, 
  TrendingUp, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { WhatIfSimulator } from '@/components/intelligence/WhatIfSimulator';

export default function WeatherShockDeepDivePage() {
  return (
    <div className='space-y-8 pb-12 animate-in fade-in'>
      
      {/* Top Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <Link
              href='/farmer/intelligence'
              className='text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition'
            >
              <ArrowLeft className='w-3.5 h-3.5' /> AI Decision Center
            </Link>
            <span className='text-xs text-slate-400'>/</span>
            <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400'>
              Weather Shock Simulator
            </span>
          </div>

          <h1 className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1'>
            Weather Shock & Regional Shortage Deep-Dive
          </h1>
          <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5'>
            Dynamic mathematical pricing model adjusting for harvest damage, regional supply deficit, and recovery costs.
          </p>
        </div>

        <Link
          href='/farmer/intelligence'
          className='px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition self-start sm:self-auto'
        >
          View Central Decision Center
        </Link>
      </div>

      {/* Educational Guide Box: Separation of Concepts */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs'>
              1
            </span>
            <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Damage Rate vs Shortage
            </h4>
          </div>
          <p className='text-xs text-slate-600 dark:text-slate-400 leading-relaxed'>
            <strong>Crop Damage (40%)</strong> measures physical volume destroyed. <strong>Market Shortage %</strong> depends dynamically on regional consumer demand vs total surviving supply.
          </p>
        </div>

        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs'>
              2
            </span>
            <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Minimum Sustainable Price
            </h4>
          </div>
          <p className='text-xs text-slate-600 dark:text-slate-400 leading-relaxed'>
            Computed as <em>(Production + Recovery + Transport Costs) ÷ Marketable Qty</em>. For 600 kg and ₹21,500 total costs, floor is <strong>₹35.83/kg</strong>.
          </p>
        </div>

        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs'>
              3
            </span>
            <h4 className='text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
              Dynamic Price Elasticity
            </h4>
          </div>
          <p className='text-xs text-slate-600 dark:text-slate-400 leading-relaxed'>
            Shock multiplier is calculated as <em>1 + ((1 - Supply/Demand) * Elasticity)</em>. At 0.60 ratio and 0.65 elasticity, multiplier is <strong>1.26x</strong> (₹42 &rarr; <strong>₹52.92/kg</strong>).
          </p>
        </div>
      </div>

      {/* Main Interactive What-If Simulator */}
      <WhatIfSimulator />

    </div>
  );
}
