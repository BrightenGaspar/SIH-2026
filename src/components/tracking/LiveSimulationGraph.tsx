'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Thermometer, AlertTriangle, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

interface TempPoint {
  time: string;
  temp: number;
}

interface LiveSimulationGraphProps {
  shipmentId: string;
  vehicleNumber?: string;
  currentTemp: number;
  targetTemp?: number;
  history: TempPoint[];
  hasBreach: boolean;
  onTriggerBreach?: () => void;
  onReset?: () => void;
  className?: string;
}

export function LiveSimulationGraph({
  shipmentId,
  vehicleNumber = 'TS 08 UB 4192',
  currentTemp,
  targetTemp = 6.0,
  history,
  hasBreach,
  onTriggerBreach,
  onReset,
  className = '',
}: LiveSimulationGraphProps) {
  const chartData = history && history.length > 0
    ? history
    : currentTemp != null
    ? [{ time: 'Now', temp: currentTemp }]
    : [];

  const isBreached = hasBreach || (currentTemp != null && currentTemp > 8.0);

  return (
    <div className={`p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 ${className}`}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
            isBreached 
              ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Live Cold-Chain Telemetry Graph</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isBreached 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {isBreached ? '⚠️ CRITICAL BREACH' : '✓ IN-RANGE (2-8°C)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Trip #{shipmentId} &bull; Vehicle: {vehicleNumber} &bull; Target: {targetTemp.toFixed(1)}°C
            </p>
          </div>
        </div>

        {/* Current Big Temp Indicator */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver-Reported Temp</span>
            <span className={`text-2xl font-black ${isBreached ? 'text-rose-600' : 'text-emerald-700'}`}>
              {currentTemp.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Live Temperature Line Chart */}
      <div className="w-full h-56 relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              domain={[0, 14]} 
              unit="°C" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '11px',
                border: 'none',
              }}
              formatter={(val: any) => [`${Number(val).toFixed(1)}°C`, 'Temperature']}
            />
            
            {/* 8°C Critical Spoilage Threshold Line */}
            <ReferenceLine
              y={8}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: '8.0°C Max Safe Threshold',
                fill: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
                position: 'top',
              }}
            />

            {/* 2°C Lower Chilling Limit Line */}
            <ReferenceLine
              y={2}
              stroke="#38bdf8"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: '2.0°C Min Floor',
                fill: '#0284c7',
                fontSize: 9,
                position: 'bottom',
              }}
            />

            {/* Actual Temperature Line */}
            <Line
              type="monotone"
              dataKey="temp"
              stroke={isBreached ? '#ef4444' : '#10b981'}
              strokeWidth={3}
              dot={{ r: 4, fill: isBreached ? '#ef4444' : '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Optimal Perishable Window: <strong>2.0°C – 8.0°C</strong></span>
        </div>
        <span className="text-slate-400 font-mono">
          Updates every 10 seconds via SimulationEngine (Random-walk model)
        </span>
      </div>
    </div>
  );
}
