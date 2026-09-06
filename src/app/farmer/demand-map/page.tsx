'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { aiService } from '@/services/aiService';
import { DemandZone } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBandwidth } from '@/context/BandwidthContext';
import { MapPin, Sparkles, TrendingUp, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function DemandMapPage() {
  const [zones, setZones] = useState<DemandZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DemandZone | null>(null);
  const { isLowBandwidth, toggleLowBandwidth } = useBandwidth();

  useEffect(() => {
    aiService.getDemandZones().then((res) => {
      setZones(res);
      setSelectedZone(res[0]);
    });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Agricultural Demand Intelligence Map</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time supply deficits, bulk buyer concentrations, and regional price arbitrage across India.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isLowBandwidth ? "primary" : "secondary"} size="sm" onClick={toggleLowBandwidth}>
            {isLowBandwidth ? 'Low-Bandwidth Table Mode (Active)' : 'Switch to Table View'}
          </Button>
        </div>
      </div>

      {/* Main Map + Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Leaflet Map or Fallback Table */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden h-[500px] flex flex-col justify-between">
            {!isLowBandwidth ? (
              <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                {/* Simulated Interactive SVG Agricultural Regional Map */}
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6 flex flex-col justify-between border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live India Regional Hubs
                    </span>
                    <span>Client Rendered (Zero Latency)</span>
                  </div>

                  {/* Hotspots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
                    {zones.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          selectedZone?.id === zone.id
                            ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-950/40 scale-[1.02]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{zone.region}</span>
                          <StatusBadge status={zone.opportunityLevel} />
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1">
                          <div className="flex justify-between"><span>Demand:</span> <strong className="text-white">{zone.demandKg.toLocaleString()} kg</strong></div>
                          <div className="flex justify-between"><span>Local Supply:</span> <span>{zone.supplyKg.toLocaleString()} kg</span></div>
                          <div className="flex justify-between font-bold text-emerald-400"><span>Supply Gap:</span> <span>{zone.gapKg > 0 ? `+${zone.gapKg.toLocaleString()} kg` : 'Excess Supply'}</span></div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                    <span>Selected: <strong className="text-white">{selectedZone?.region}</strong></span>
                    <span className="text-emerald-400 font-bold">{selectedZone?.buyerCount} Active Direct Bidders</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Low-Bandwidth Fallback Table */
              <div className="p-6 overflow-y-auto h-full">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Regional Demand Data (Low-Bandwidth Mode)</h3>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="pb-2">Region</th>
                      <th className="pb-2">Commodity</th>
                      <th className="pb-2">Demand</th>
                      <th className="pb-2">Supply</th>
                      <th className="pb-2">Deficit Gap</th>
                      <th className="pb-2">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {zones.map((z) => (
                      <tr key={z.id} onClick={() => setSelectedZone(z)} className="cursor-pointer hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-white">{z.region}</td>
                        <td className="py-2.5">{z.commodity}</td>
                        <td className="py-2.5">{z.demandKg.toLocaleString()} kg</td>
                        <td className="py-2.5">{z.supplyKg.toLocaleString()} kg</td>
                        <td className="py-2.5 font-bold text-emerald-400">{z.gapKg > 0 ? `+${z.gapKg.toLocaleString()} kg` : 'Surplus'}</td>
                        <td className="py-2.5"><StatusBadge status={z.opportunityLevel} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Selected Hub Side Panel */}
        <div>
          {selectedZone ? (
            <Card variant="highlight" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Opportunity Intel</span>
                <StatusBadge status={selectedZone.opportunityLevel} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{selectedZone.region}</h3>
                <span className="text-xs text-slate-400">{selectedZone.state} • Commodity: <strong className="text-white">{selectedZone.commodity}</strong></span>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Buyer Inflow Demand:</span>
                  <span className="font-bold text-white">{selectedZone.demandKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Local Hub Supply:</span>
                  <span>{selectedZone.supplyKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm">
                  <span>Supply Deficit Gap:</span>
                  <span>+{selectedZone.gapKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                  <span>Offered Price:</span>
                  <span className="font-bold text-white">{formatINR(selectedZone.pricePerKg)}/kg</span>
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block mb-1">💡 Smart Recommendation:</span>
                <p>Consolidate Shadnagar Tomato harvest. Dispatch via Tata 407 Reefer to capture +₹4.00/kg premium over local mandi.</p>
              </div>

              <Button className="w-full">
                <span>Dispatch Lot to {selectedZone.region.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Card>
          ) : (
            <Card className="p-6 text-center text-slate-400">Select a zone on the map</Card>
          )}
        </div>

      </div>

    </div>
  );
}
