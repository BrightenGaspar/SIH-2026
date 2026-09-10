'use client';

import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { formatINR } from '@/lib/utils';
import { RotateCcw, Check, Sparkles, ShieldCheck } from 'lucide-react';

export default function ReturnLoadsPage() {
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const opportunities = [
    {
      id: 'RET-HYD-WGL-01',
      route: 'Bowenpally Terminal (Hyderabad) -> Warangal Hub',
      commodity: 'Organic Fertilizer Sacks & Seedlings',
      weightKg: 2200,
      additionalEarnings: 2800,
      emptyDistanceAvoidedKm: 142,
      vehicleMatch: 'Tata 407 Reefer (TS 08 UB 4192)',
    },
    {
      id: 'RET-WGL-GNT-02',
      route: 'Warangal Commercial Mandi -> Guntur Agriculture Park',
      commodity: 'Clean HDPE Harvest Packaging Crates',
      weightKg: 1000,
      additionalEarnings: 1900,
      emptyDistanceAvoidedKm: 110,
      vehicleMatch: 'Mahindra Bolero (TS 07 EA 8831)',
    }
  ];

  const handleClaim = (id: string) => {
    setClaimed(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Return Load Matching AI</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Eliminate deadhead mileage by claiming non-perishable return cargo for vehicles returning to origin clusters.
        </p>
      </div>

      <div className="space-y-4">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-amber-500/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">{opp.id}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold">
                  Matched for {opp.vehicleMatch}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{opp.route}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Return Cargo: <strong className="text-slate-700 dark:text-slate-200">{opp.commodity}</strong> ({opp.weightKg.toLocaleString()} kg) &bull; Avoids <strong className="text-emerald-500">{opp.emptyDistanceAvoidedKm} km empty return haul</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto justify-between">
              <div className="text-left lg:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Added Operator Revenue</span>
                <span className="text-xl font-black text-emerald-500">+{formatINR(opp.additionalEarnings)}</span>
              </div>

              <Button
                onClick={() => handleClaim(opp.id)}
                className={`${claimed[opp.id] ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'}`}
              >
                {claimed[opp.id] ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Return Load Locked
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-1" /> Claim Return Load
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
