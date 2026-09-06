'use client';

import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { mockProducePools } from '@/services/mockData/mockForecasts';
import { Users, Truck, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export function GroupSellingCard() {
  const [pools, setPools] = useState(mockProducePools);
  const [joined, setJoined] = useState(true);

  const activePool = pools[0];

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Group Selling / Produce Pooling</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hyderabad Wholesale Direct Order (5,000 kg)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
            {activePool.status}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Join 3 neighboring farmers in the Shadnagar cluster to fulfill a single 5,000 kg bulk demand order for <strong>{activePool.buyerName}</strong>.
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-700 dark:text-slate-300">Pooled: {activePool.currentQuantityKg.toLocaleString()} / {activePool.targetQuantityKg.toLocaleString()} kg</span>
            <span className="text-emerald-500 font-bold">100% Target Met</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Participant breakdown */}
        <div className="space-y-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Cluster Participants:</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {activePool.participants.map((p) => (
              <div key={p.id} className={`p-2 rounded-lg border ${p.isCurrentUser ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'}`}>
                <span className="font-bold block truncate">{p.farmerName}</span>
                <span className="text-[11px] opacity-80">{p.quantityKg.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Savings metric */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Shared Road Freight Savings:</span>
          </div>
          <span className="font-bold text-emerald-400">{activePool.estimatedFreightSavingsPercent}% Lower Cost/kg</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={joined ? "secondary" : "primary"}
          size="sm"
          className="flex-1"
          onClick={() => setJoined(!joined)}
        >
          {joined ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Joined (1,200 kg committed)</> : 'Join Group Pool'}
        </Button>
      </div>
    </Card>
  );
}
