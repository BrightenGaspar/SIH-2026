'use client';

import React from 'react';
import { FarmerCluster } from '@/types/cluster';
import { useBandwidth } from '@/context/BandwidthContext';
import { MapPin, Users, Truck, Building2, Radio } from 'lucide-react';

interface ClusterMapProps {
  cluster: FarmerCluster;
  className?: string;
}

export function ClusterMap({ cluster, className = '' }: ClusterMapProps) {
  const { isLowBandwidth } = useBandwidth();

  // If Low Bandwidth Mode is enabled, render clean zero-latency tabular view
  if (isLowBandwidth) {
    return (
      <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900">
              5 km Radius Cluster Geofence (Low-Bandwidth Table)
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Center: {cluster.centerPlace} ({cluster.radiusKm} km)
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {(cluster.inventory || []).map((item, idx) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">{item.farmerDisplayName}</span>
                <span className="text-[11px] text-slate-400">~{item.distanceFromCenterKm || (idx + 1) * 1.1} km from hub</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-900">{item.quantityKg} kg</span>
                <span className="text-emerald-700 font-semibold">{item.qualityGrade}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal Graphical GIS View
  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-md ${className}`}>
      
      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <div>
          <span className="font-black text-white block">{cluster.name}</span>
          <span className="text-[10px] text-emerald-400">
            {cluster.radiusKm} km radius &bull; Center: {cluster.centerPlace} ({cluster.centerLat.toFixed(4)}, {cluster.centerLng.toFixed(4)})
          </span>
        </div>
      </div>

      {/* SVG Cluster Geofence & Waypoints Visualization */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-radial from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Subtle Map Grid lines */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* 5 KM RADIUS SVG CIRCLE */}
        <svg className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] absolute" viewBox="0 0 320 320">
          {/* Outer Pulse */}
          <circle
            cx="160"
            cy="160"
            r="120"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ animationDuration: '40s' }}
          />

          {/* 5 km Area Fill */}
          <circle
            cx="160"
            cy="160"
            r="120"
            fill="#10b981"
            fillOpacity="0.08"
          />

          {/* 2.5 km Inner Ring */}
          <circle
            cx="160"
            cy="160"
            r="60"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* Radial Lines to Farmers */}
          <line x1="160" y1="160" x2="110" y2="105" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <line x1="160" y1="160" x2="220" y2="120" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <line x1="160" y1="160" x2="120" y2="210" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <line x1="160" y1="160" x2="215" y2="215" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
        </svg>

        {/* Center Cluster Hub (Shadnagar Cold Collection Point) */}
        <div className="absolute z-20 flex flex-col items-center">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-400/20">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/30">
            Hub: {cluster.centerPlace}
          </span>
        </div>

        {/* Farmer A Node (North-West) */}
        <div className="absolute top-[85px] left-[70px] sm:left-[100px] z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-md">
            250
          </div>
          <span className="text-[9px] text-slate-300 font-bold mt-0.5 bg-slate-900/80 px-1.5 py-0.5 rounded">
            Farmer A
          </span>
        </div>

        {/* Farmer B Node (North-East) */}
        <div className="absolute top-[95px] right-[70px] sm:right-[100px] z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-md">
            300
          </div>
          <span className="text-[9px] text-slate-300 font-bold mt-0.5 bg-slate-900/80 px-1.5 py-0.5 rounded">
            Farmer B
          </span>
        </div>

        {/* Farmer C Node (South-West) */}
        <div className="absolute bottom-[80px] left-[75px] sm:left-[110px] z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-md">
            200
          </div>
          <span className="text-[9px] text-slate-300 font-bold mt-0.5 bg-slate-900/80 px-1.5 py-0.5 rounded">
            Farmer C
          </span>
        </div>

        {/* Farmer D Node (South-East) */}
        <div className="absolute bottom-[75px] right-[75px] sm:right-[105px] z-10 flex flex-col items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-md">
            350
          </div>
          <span className="text-[9px] text-slate-300 font-bold mt-0.5 bg-slate-900/80 px-1.5 py-0.5 rounded">
            Farmer D
          </span>
        </div>

        {/* Bottom Status Ribbon */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>5 km Consolidation Zone</span>
          </div>
          <div className="text-slate-300">
            Total Aggregated: <strong className="text-white">{(cluster.currentQuantityKg / 1000).toFixed(2)} Tonnes</strong> (Target: 1.0 T)
          </div>
        </div>

      </div>

    </div>
  );
}
