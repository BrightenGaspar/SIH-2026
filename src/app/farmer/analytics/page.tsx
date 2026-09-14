'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { marketPriceService } from '@/services/marketPriceService';
import { aiService } from '@/services/aiService';
import { PriceTrendPoint, SIHScenarioData } from '@/types/farmer';
import { formatINR } from '@/lib/utils';
import {
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function FarmerAnalyticsPage() {
  const [priceTrends, setPriceTrends] = useState<PriceTrendPoint[]>([]);
  const [sihData, setSihData] = useState<SIHScenarioData | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'realization'>('trends');

  useEffect(() => {
    marketPriceService.getPriceTrends('Tomato').then(setPriceTrends);
    aiService.getSIHScenario().then(setSihData);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Back to Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
        <div>
          <Link
            href="/farmer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Farmer Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-500" /> Market Analytics & Forecasts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real market prices, AI 7-day surge projections, and transparent net realization comparisons.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'trends'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Price Trends
          </button>
          <button
            onClick={() => setActiveTab('realization')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'realization'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Realization
          </button>
        </div>
      </div>

      {/* Tab 1: Price Trends & AI Forecast */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tomato (Hybrid Desi) - 7-Day Mandi vs. Direct Buyer Surge</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Comparing forecasted Mandi market price with direct institutional contract rates.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Optimal Selling Window: Day +4
                </span>
              </div>
            </div>

            {priceTrends.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis domain={[30, 48]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                      formatter={(val: unknown) => [formatINR(Number(val) || 0) + '/kg', 'Price']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="currentMandi" stroke="#94a3b8" strokeWidth={2} name="Historic Mandi (INR/kg)" />
                    <Line type="monotone" dataKey="forecastedPrice" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="AI Forecast Mandi (INR/kg)" />
                    <Line type="monotone" dataKey="buyerDemandPrice" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="4 4" name="Direct Buyer Offer (INR/kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No analytics data available yet.</div>
            )}
          </Card>

          {/* Forecast Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Benchmark Mandi Rate</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatINR(38.00)}/kg</div>
              <span className="text-xs text-slate-500 mt-1 block">Bowenpally / Chevella Mandi</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Surge Window Peak (Day +4)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatINR(41.20)}/kg</div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">+{formatINR(3.20)}/kg (+8.4%) price lift</span>
            </Card>

            <Card className="p-5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Direct Buyer Institutional Rate</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatINR(42.00)}/kg</div>
              <span className="text-xs text-slate-500 mt-1 block">Net payout after cold freight</span>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Realization Comparison */}
      {activeTab === 'realization' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Conventional Intermediary vs. AgriFlow Direct Realization</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Itemized comparison on 5,000 kg lot showing net farmer bank deposits.</p>

            {sihData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">Traditional Mandi Intermediary Route</span>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{formatINR(sihData.conventionalPrice)}/kg</div>
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between"><span>Middlemen commission (3 levels):</span> <span className="text-rose-500">-{formatINR(6.00)}/kg</span></div>
                    <div className="flex justify-between"><span>Unregulated weighment deductions:</span> <span className="text-rose-500">-{formatINR(3.00)}/kg</span></div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1"><span>Total Gross Realization (5,000 kg):</span> <span>{formatINR(sihData.conventionalPrice * 5000)}</span></div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/40 space-y-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">AgriFlow Direct Institutional Route</span>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatINR(sihData.agriflowRealization)}/kg</div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-emerald-500/30">
                    <div className="flex justify-between"><span>Buyer Agreed Contract Price:</span> <span className="font-semibold text-white">{formatINR(45.00)}/kg</span></div>
                    <div className="flex justify-between"><span>Consolidated Road Cold Freight:</span> <span>-{formatINR(2.00)}/kg</span></div>
                    <div className="flex justify-between"><span>Platform & Escrow Fee:</span> <span>-{formatINR(1.00)}/kg</span></div>
                    <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 text-sm">
                      <span>Total Net Farmer Deposit (5,000 kg):</span>
                      <span>{formatINR(sihData.agriflowRealization * 5000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">Realization benchmark data unavailable.</div>
            )}

            {sihData && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Total Added Net Income for Farmer on this lot:</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">+{formatINR(sihData.totalAdditionalRealization)} (+{sihData.percentageImprovement}%)</span>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}