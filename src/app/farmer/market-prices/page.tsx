'use client';

import React, { useState, useEffect } from 'react';
import { marketPriceService } from '@/services/marketPriceService';
import { MarketPrice, PriceTrendPoint } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatINR } from '@/lib/utils';
import { useBandwidth } from '@/context/BandwidthContext';

export default function MandiPricesPage() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const { isLowBandwidth } = useBandwidth();

  useEffect(() => {
    marketPriceService.getMarketPrices().then(setPrices);
  }, []);

  const filtered = prices.filter(p => {
    const matchComm = selectedCommodity === 'All' || p.commodity.toLowerCase() === selectedCommodity.toLowerCase();
    const matchState = selectedState === 'All' || p.state.toLowerCase() === selectedState.toLowerCase();
    return matchComm && matchState;
  });

  const chartData = filtered.map(p => ({
    name: p.marketName.replace(' Mandi', '').replace(' (Bowenpally)', ''),
    mandiPrice: p.currentPrice,
    buyerOpportunity: p.bulkBuyerOpportunityPrice,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Mandi Market Prices & Arbitrage</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Compare daily mandi benchmarks against AgriFlow direct bulk-buyer procurement opportunities.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-400 block mb-1">Commodity</label>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
          >
            <option value="All">All Commodities</option>
            <option value="Tomato">Tomato</option>
            <option value="Green Chilli">Green Chilli</option>
            <option value="Onion">Onion</option>
            <option value="Potato">Potato</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block mb-1">State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
          >
            <option value="All">All States</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Karnataka">Karnataka</option>
          </select>
        </div>
      </div>

      {/* Comparison Chart */}
      {!isLowBandwidth && chartData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mandi vs AgriFlow Buyer Realization (₹/kg)</h3>
              <p className="text-xs text-slate-400">Green bar represents potential higher realization through direct buyer demand</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 65]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: unknown) => [`₹${Number(val) || 0}/kg`, 'Price']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="mandiPrice" fill="#64748b" radius={[4, 4, 0, 0]} name="Local Mandi Price" />
                <Bar dataKey="buyerOpportunity" fill="#10b981" radius={[4, 4, 0, 0]} name="AgriFlow Buyer Opportunity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Mandi Table */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Regional Mandi Price Board</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Commodity</th>
                <th className="pb-3 font-semibold">Market Name</th>
                <th className="pb-3 font-semibold">District, State</th>
                <th className="pb-3 font-semibold">Current Mandi</th>
                <th className="pb-3 font-semibold">24h Change</th>
                <th className="pb-3 font-semibold">AgriFlow Buyer Price</th>
                <th className="pb-3 font-semibold">Potential Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((item) => {
                const diff = item.bulkBuyerOpportunityPrice - item.currentPrice;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{item.commodity}</td>
                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{item.marketName}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{item.district}, {item.state}</td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{formatINR(item.currentPrice)}/kg</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${item.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.percentageChange}%)
                      </span>
                    </td>
                    <td className="py-3 font-black text-emerald-500 text-sm">{formatINR(item.bulkBuyerOpportunityPrice)}/kg</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold">
                        +{formatINR(diff)}/kg
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
