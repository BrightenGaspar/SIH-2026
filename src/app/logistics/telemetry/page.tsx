'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { Thermometer, Snowflake, Clock, ShieldCheck, Activity } from 'lucide-react';

export default function ColdChainTelemetryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Live Cold-Chain Telemetry</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perishable safe-window tracking, reefer temperature auditing, and sensor logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tata 407 Reefer</span>
            <span className="text-xs font-mono font-bold text-amber-500">TS 08 UB 4192</span>
          </div>
          <div className="text-3xl font-black text-emerald-500">6.2°C</div>
          <p className="text-xs text-slate-400">Cargo: Tomato (Hybrid Desi) &bull; Target: 6.0&deg;C &bull; Humidity: 88%</p>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Spoilage Safe Window: 4h 32m (Low Risk)
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mahindra Bolero</span>
            <span className="text-xs font-mono font-bold text-amber-500">TS 07 EA 8831</span>
          </div>
          <div className="text-3xl font-black text-blue-400">8.5°C</div>
          <p className="text-xs text-slate-400">Cargo: Green Chilli (G4) &bull; Target: 8.0&deg;C &bull; Humidity: 75%</p>
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Insulated Vent Active: Safe Window 96h+
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tata Ace</span>
            <span className="text-xs font-mono font-bold text-slate-400">TS 09 XY 1029</span>
          </div>
          <div className="text-3xl font-black text-slate-400">24.0°C</div>
          <p className="text-xs text-slate-400">Cargo: Empty (In Depot Park) &bull; Ambient ventilated</p>
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400">
            Available for immediate farm gate dispatch
          </div>
        </Card>
      </div>
    </div>
  );
}
