'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { aiService } from '@/services/aiService';
import { SIHScenarioData } from '@/types/farmer';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export function FarmerImpactCard() {
  const [scenario, setScenario] = useState<SIHScenarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    aiService.getSIHScenario()
      .then((data) => {
        if (isMounted) setScenario(data);
      })
      .catch(() => {
        if (isMounted) setScenario(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <Card variant="highlight" className="relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Direct Farmer Realization Advantage
          </div>
          <h3 className="text-xl font-extrabold text-white">Direct Realization & Middlemen Elimination</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Comparing conventional mandi intermediaries vs. AgriFlow direct institutional demand pooling for {scenario?.commodity || 'Produce'}.
          </p>

          {loading ? (
            <div className="py-6 text-xs text-slate-400">Loading realization data...</div>
          ) : !scenario ? (
            <div className="py-6 text-xs text-slate-400">
              Direct realization impact data will appear here when the backend is connected.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Conventional Mandi</span>
                <span className="text-lg font-black text-slate-300">{formatINR(scenario.conventionalPrice)}<span className="text-xs font-normal">/kg</span></span>
              </div>
              <div className="bg-emerald-950/60 rounded-xl p-3.5 border border-emerald-500/40">
                <span className="text-[11px] text-emerald-300 block font-bold">AgriFlow Net Payout</span>
                <span className="text-xl font-black text-emerald-400">{formatINR(scenario.agriflowRealization)}<span className="text-xs font-normal">/kg</span></span>
              </div>
              <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Price Improvement</span>
                <span className="text-lg font-black text-emerald-400">+{formatINR(scenario.improvementPerKg)}/kg</span>
                <span className="text-[10px] text-emerald-300 block">+{scenario.percentageImprovement}% gain</span>
              </div>
              <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Total Added Earnings</span>
                <span className="text-lg font-black text-emerald-400">+{formatINR(scenario.totalAdditionalRealization)}</span>
                <span className="text-[10px] text-slate-400 block">on {scenario.targetDemandKg.toLocaleString()} kg pool</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-72 bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Transparent Realization
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Direct Buyer Price:</span>
              <span className="font-semibold text-white">{scenario ? `₹${scenario.agriflowRealization + 3}/kg` : '--'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Road Logistics:</span>
              <span>{scenario ? '-₹2.00/kg' : '--'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>AgriFlow Fee:</span>
              <span>{scenario ? '-₹1.00/kg' : '--'}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400 text-sm">
              <span>Farmer Net Realization:</span>
              <span>{scenario ? `₹${scenario.agriflowRealization}/kg` : '--'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Intermediary middlemen:</span>
            <span className="text-emerald-400 font-bold">0 (Direct)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
