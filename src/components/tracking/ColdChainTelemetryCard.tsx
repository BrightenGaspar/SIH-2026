'use client';

import React from 'react';
import { ColdChainTelemetry, SpoilageRiskLevel } from '@/types/delivery';
import { Thermometer, Snowflake, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ColdChainTelemetryCardProps {
  telemetry: ColdChainTelemetry;
}

export default function ColdChainTelemetryCard({ telemetry }: ColdChainTelemetryCardProps) {
  const getRiskColor = (risk: SpoilageRiskLevel) => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Snowflake className="w-4 h-4 text-cyan-500" /> Cold-Chain Telemetry & Spoilage
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
          SIMULATED TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Current Temp */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-400 block font-medium">Reefer Temp</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {telemetry.temperatureCelsius}°C
          </div>
          <span className="text-[10px] text-slate-500">Target: {telemetry.targetTempCelsius}°C</span>
        </div>

        {/* Safe Window */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-400 block font-medium">Safe Freshness Window</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {telemetry.safeWindowHours}h {telemetry.safeWindowMinutes}m
          </div>
          <span className="text-[10px] text-slate-500">Humidity: {telemetry.humidityPercent}% RH</span>
        </div>

        {/* Spoilage Risk */}
        <div className={`p-3.5 rounded-2xl border col-span-2 sm:col-span-1 ${getRiskColor(telemetry.spoilageRisk)}`}>
          <span className="text-[11px] block font-medium opacity-80">Spoilage Risk Level</span>
          <div className="text-2xl font-black mt-0.5 flex items-center gap-1">
            {telemetry.spoilageRisk === 'LOW' && <ShieldCheck className="w-5 h-5" />}
            {telemetry.spoilageRisk !== 'LOW' && <AlertTriangle className="w-5 h-5" />}
            {telemetry.spoilageRisk}
          </div>
          <span className="text-[10px] opacity-80">
            {telemetry.reeferActive ? 'Reefer: RUNNING' : 'Ambient Ventilated'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        &ldquo;{telemetry.explanation}&rdquo;
      </p>
    </div>
  );
}
