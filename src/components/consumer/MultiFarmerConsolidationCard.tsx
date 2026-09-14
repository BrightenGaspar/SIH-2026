'use client';

import React from 'react';
import { MultiFarmerSource } from '@/types/consumer';
import { Users, ShieldCheck, MapPin } from 'lucide-react';

interface MultiFarmerConsolidationCardProps {
  sources: MultiFarmerSource[];
  totalQuantityKg: number;
  produceName: string;
  isSIHDemoHighlight?: boolean;
}

export const MultiFarmerConsolidationCard: React.FC<MultiFarmerConsolidationCardProps> = ({
  sources,
  totalQuantityKg,
  produceName,
  isSIHDemoHighlight = false,
}) => {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
      isSIHDemoHighlight
        ? 'bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-900 border-emerald-500/40 shadow-lg'
        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Multi-Farmer AI Sourcing Consolidation
              </h3>
              {isSIHDemoHighlight && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-500 text-white">
                  SIH Demo Realization
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Aggregated across {sources.length} local partner farms for seamless {totalQuantityKg.toLocaleString('en-IN')} kg bulk fulfillment ({produceName})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Consolidated Volume</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {totalQuantityKg.toLocaleString('en-IN')} kg
          </span>
        </div>
      </div>

      {/* Visual Multi-Source Distribution */}
      <div className="mt-5 space-y-4">
        {sources.map((source, index) => (
          <div
            key={source.farmerOrFpoId || index}
            className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                0{index + 1}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  {source.name}
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    Grade {source.grade}
                  </span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-500" /> {source.location}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-200 dark:border-zinc-700">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-zinc-400 block">Volume Share</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {source.quantityKg.toLocaleString('en-IN')} kg ({source.contributionPercent}%)
                </span>
              </div>
              <div className="w-24 bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${source.contributionPercent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Fair direct farmer payout guaranteed via Smart Escrow
        </span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          Single Consolidated Road Delivery
        </span>
      </div>
    </div>
  );
};

export default MultiFarmerConsolidationCard;
