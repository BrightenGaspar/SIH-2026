'use client';

import React from 'react';
import { ReturnLoadDetails } from '@/types/delivery';
import { RotateCcw, TrendingUp, ShieldCheck } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface ReturnLoadCardProps {
  returnLoad?: ReturnLoadDetails;
}

export default function ReturnLoadCard({ returnLoad }: ReturnLoadCardProps) {
  if (!returnLoad) return null;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/40 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl flex-shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300">
                Return Load Matched (Zero Empty Run)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                AI Logistics Optimization
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              {returnLoad.route}
            </h4>
            <p className="text-xs text-slate-300">
              Return Cargo: <strong>{returnLoad.commodity}</strong> • Avoids{' '}
              <strong className="text-emerald-300">{returnLoad.emptyDistanceAvoidedKm} km</strong> empty return haul.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right flex-shrink-0">
          <span className="text-xs text-slate-400 block">Carrier Added Realization</span>
          <span className="text-xl font-black text-emerald-400">
            +{formatINR(returnLoad.additionalEarnings)}
          </span>
        </div>
      </div>
    </div>
  );
}
