'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FactorContribution {
  name: string;
  weight: string;
  impact: string;
  value: string;
  direction: 'up' | 'down' | 'neutral';
}

interface ExplainableAICardProps {
  title?: string;
  confidenceScore?: number;
  factors: FactorContribution[];
  explanationNarrative: string;
  minimumSustainablePrice?: number;
  unclampedPrice?: number;
  clampedPrice?: number;
  className?: string;
}

export function ExplainableAICard({
  title = 'Explainable AI Decision Audit',
  confidenceScore = 92,
  factors,
  explanationNarrative,
  minimumSustainablePrice,
  unclampedPrice,
  clampedPrice,
  className,
}: ExplainableAICardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all', className)}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className='p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none'
      >
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
            <Sparkles className='w-4 h-4' />
          </div>
          <div>
            <h4 className='text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5'>
              {title}
              <span className='text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'>
                Transparent Model
              </span>
            </h4>
            <p className='text-[11px] text-slate-500 dark:text-slate-400'>
              Dynamic breakdown of mathematical weights, regional elasticity & cost baselines
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <div className='hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50'>
            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400' />
            <span className='text-xs font-bold text-emerald-700 dark:text-emerald-300'>
              {confidenceScore}% Confidence
            </span>
          </div>
          <button className='p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'>
            {isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className='p-4 space-y-4'>
          {/* Narrative box */}
          <div className='bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300'>
            <span className='font-bold text-emerald-800 dark:text-emerald-400'>Mathematical Logic: </span>
            {explanationNarrative}
          </div>

          {/* Key benchmark callouts */}
          {(minimumSustainablePrice !== undefined || unclampedPrice !== undefined) && (
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1'>
              {minimumSustainablePrice !== undefined && (
                <div className='bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800'>
                  <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Sustainable Floor</span>
                  <span className='text-sm font-extrabold text-slate-900 dark:text-white'>₹{minimumSustainablePrice.toFixed(2)}/kg</span>
                  <span className='text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5'>Covers all recovery costs</span>
                </div>
              )}
              {unclampedPrice !== undefined && (
                <div className='bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800'>
                  <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Unclamped Shock Price</span>
                  <span className='text-sm font-extrabold text-blue-600 dark:text-blue-400'>₹{unclampedPrice.toFixed(2)}/kg</span>
                  <span className='text-[10px] text-slate-400 block mt-0.5'>Pure formula dynamic output</span>
                </div>
              )}
              {clampedPrice !== undefined && (
                <div className='bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1'>
                  <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Safety Clamped Output</span>
                  <span className='text-sm font-extrabold text-emerald-600 dark:text-emerald-400'>₹{clampedPrice.toFixed(2)}/kg</span>
                  <span className='text-[10px] text-slate-400 block mt-0.5'>Safe market price recommendation</span>
                </div>
              )}
            </div>
          )}

          {/* Factor contributions list */}
          <div className='space-y-2 pt-1'>
            <span className='text-[11px] font-bold uppercase text-slate-400 tracking-wider block'>
              Weighted Factor Influence
            </span>
            <div className='space-y-1.5'>
              {factors.map((factor, idx) => (
                <div 
                  key={idx} 
                  className='flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800/60'
                >
                  <div className='flex items-center gap-2'>
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      factor.direction === 'up' ? 'bg-emerald-500' : factor.direction === 'down' ? 'bg-rose-500' : 'bg-blue-500'
                    )} />
                    <span className='font-semibold text-slate-800 dark:text-slate-200'>{factor.name}</span>
                    <span className='text-[10px] text-slate-400'>({factor.weight})</span>
                  </div>

                  <div className='flex items-center gap-3'>
                    <span className='text-slate-500 dark:text-slate-400 font-mono text-[11px]'>{factor.value}</span>
                    <span className={cn(
                      'font-bold text-[11px]',
                      factor.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : factor.direction === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                    )}>
                      {factor.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className='text-[10px] text-slate-400 dark:text-slate-500 italic text-center pt-1'>
            * Simulated AI-assisted decision model. Calculations are fully deterministic and dynamically computed from live parameters.
          </p>
        </div>
      )}
    </div>
  );
}
