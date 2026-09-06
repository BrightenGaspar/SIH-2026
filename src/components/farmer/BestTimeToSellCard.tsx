'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { mockPriceTrendData } from '@/services/mockData/mockPrices';
import { TrendingUp, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBandwidth } from '@/context/BandwidthContext';
import { formatINR } from '@/lib/utils';

export function BestTimeToSellCard() {
  const { isLowBandwidth } = useBandwidth();

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Best Time to Sell (AI Forecast)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tomato (Hybrid Desi) • Price Surge Window</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            84% Confidence
          </span>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Current Mandi</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">₹38.00<span className="text-xs font-normal">/kg</span></span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">Forecast Peak (Day +4)</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹41.20<span className="text-xs font-normal">/kg</span></span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">Recommendation</span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">Hold for 4 Days</span>
          </div>
        </div>

        {/* Chart or Low-Bandwidth View */}
        {!isLowBandwidth ? (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPriceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[30, 48]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: unknown) => [`₹${Number(val) || 0}/kg`, 'Price']}
                />
                <Line type="monotone" dataKey="forecastedPrice" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Forecasted Mandi" />
                <Line type="monotone" dataKey="buyerDemandPrice" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" name="Buyer Direct" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-slate-800/40 rounded-xl p-3 text-xs space-y-1.5 border border-slate-700">
            <div className="font-semibold text-slate-300">Forecast Data (Low Bandwidth Mode):</div>
            <div className="flex justify-between text-slate-400"><span>Today:</span> <span>₹38.00/kg</span></div>
            <div className="flex justify-between text-slate-400"><span>Day +2:</span> <span>₹39.80/kg</span></div>
            <div className="flex justify-between text-emerald-400 font-bold"><span>Day +4 (Optimal):</span> <span>₹41.20/kg (+₹3.20 gain)</span></div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p className="flex items-center gap-1.5 font-medium">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Regional wholesale demand rising +18% while local harvest inflow is tapering.</span>
        </p>
      </div>
    </Card>
  );
}
