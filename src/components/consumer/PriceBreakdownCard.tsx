'use client';
import React from 'react';
import { PriceBreakdown } from '@/types/consumer';
import { Card } from '@/components/common/Card';
import { formatINR } from '@/lib/utils';
import { TrendingUp, Truck, Building, TrendingDown, Info } from 'lucide-react';

interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
  produceName?: string;
  quantityKg?: number;
  className?: string;
}

export function PriceBreakdownCard({
  breakdown,
  produceName,
  quantityKg = 1,
  className = '',
}: PriceBreakdownCardProps) {
  const mult = quantityKg;

  return (
    <Card className={`p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Transparent Price Waterfall
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero hidden brokerage • Real-time cost audit</p>
          </div>
          <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {breakdown.farmerRealizationBoostPercent}% Direct
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 block">Farmer Receives Directly</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Paid immediately upon harvest arrival</span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(breakdown.farmerReceivesPerKg * mult)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">Road Freight & Reefer Energy</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Direct highway transport</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatINR(breakdown.roadLogisticsPerKg * mult)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">Platform & Quality Assurance</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Computer-vision certification</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatINR(breakdown.platformFeePerKg * mult)}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Conventional Mandi Retail Estimate</span>
            <span className="line-through text-slate-400">{formatINR(breakdown.conventionalMarketPricePerKg * mult)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> + {breakdown.farmerRealizationBoostPercent}% Farmer Return
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PriceBreakdownCard;
