'use client';

import React from 'react';
import { ColdChainTelemetry, SpoilageRiskLevel } from '@/types/delivery';
import { Thermometer, Snowflake, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

interface ColdChainTelemetryCardProps {
  telemetry?: ColdChainTelemetry;
  lastUpdated?: string | null;
  source?: string;
}

export default function ColdChainTelemetryCard({ 
  telemetry,
  lastUpdated,
  source = 'Verified Reefer IoT Sensor',
}: ColdChainTelemetryCardProps) {
  const getRiskColor = (risk?: SpoilageRiskLevel) => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
      case 'HIGH':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30';
    }
  };

  const hasTemp = telemetry?.temperatureCelsius != null;
  const isBreached = hasTemp && telemetry!.temperatureCelsius > (telemetry!.targetTempCelsius + 2.0 || 8.0);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Cold-Chain Telemetry & Spoilage
        </span>
        <DataStatusBadge
          lastUpdated={lastUpdated}
          freshnessThresholdMinutes={3}
          source={source}
          showSource={false}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Current Temp */}
        <div className={`p-3.5 rounded-2xl border ${isBreached ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">Driver-Reported Cargo Temperature</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {hasTemp ? (
              `${telemetry!.temperatureCelsius}°C`
            ) : (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">No driver reading reported</span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">
            {hasTemp ? `Target: ${telemetry!.targetTempCelsius}°C` : 'Phone GPS active • Sensor not connected'}
          </span>
        </div>

        {/* Safe Window */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">Safe Freshness Window</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {hasTemp ? (
              `${telemetry?.safeWindowHours || 4}h ${telemetry?.safeWindowMinutes || 0}m`
            ) : (
              '—'
            )}
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">
            {telemetry?.humidityPercent != null
              ? `Humidity: ${telemetry.humidityPercent}% RH`
              : 'Humidity: No live reading'}
          </span>
        </div>

        {/* Spoilage Risk */}
        <div className={`p-3.5 rounded-2xl border col-span-2 sm:col-span-1 ${getRiskColor(telemetry?.spoilageRisk)}`}>
          <span className="text-[11px] block font-semibold opacity-90">Spoilage Risk Level</span>
          <div className="text-2xl font-black mt-0.5 flex items-center gap-1">
            {telemetry?.spoilageRisk === 'LOW' && <ShieldCheck className="w-5 h-5" />}
            {telemetry?.spoilageRisk && telemetry?.spoilageRisk !== 'LOW' && <AlertTriangle className="w-5 h-5" />}
            {telemetry?.spoilageRisk || 'PENDING'}
          </div>
          <span className="text-[10px] font-medium opacity-90">
            {telemetry?.reeferActive ? 'Reefer: ACTIVE' : hasTemp ? 'Ambient Transit' : 'Phone GPS Beacon Active'}
          </span>
        </div>
      </div>

      {telemetry?.explanation && (
        <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          &ldquo;{telemetry.explanation}&rdquo;
        </p>
      )}
    </div>
  );
}
