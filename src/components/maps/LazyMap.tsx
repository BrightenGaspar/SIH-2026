'use client';

import React, { useState } from 'react';
import { useBandwidth } from '@/context/BandwidthContext';
import { Truck, MapPin, Navigation, ArrowRight, Eye, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyMapProps {
  children: React.ReactNode;
  vehicleId?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  totalDistanceKm?: number;
  status?: string;
  lastUpdated?: string;
  role?: 'farmer' | 'consumer' | 'logistics';
  className?: string;
}

export function LazyMap({
  children,
  vehicleId = 'TRK-CONS-ROAD-9021',
  origin = 'Shadnagar Farm Hub',
  destination = 'Hyderabad APMC Corridor',
  distanceKm = 46,
  totalDistanceKm = 74,
  status = 'In Transit',
  lastUpdated = 'Just now',
  role = 'farmer',
  className,
}: LazyMapProps) {
  const { isLowBandwidth } = useBandwidth();
  const [showMap, setShowMap] = useState(false);

  // If Normal Mode, render map immediately
  if (!isLowBandwidth) {
    return <div className={cn('relative w-full rounded-2xl overflow-hidden shadow-sm', className)}>{children}</div>;
  }

  // If Low Bandwidth Mode and user explicitly clicked "View Map", render map with header
  if (showMap) {
    return (
      <div className={cn('relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200', className)}>
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Map Loaded on Demand (Low Bandwidth Mode)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowMap(false)}
            className="text-slate-500 hover:text-slate-900 font-bold underline cursor-pointer"
          >
            Hide Map
          </button>
        </div>
        {children}
      </div>
    );
  }

  // If Low Bandwidth Mode and map not yet requested, show lightweight text summary card
  const progressPercent = Math.min(100, Math.round((distanceKm / (totalDistanceKm || 1)) * 100));

  const buttonStyle =
    role === 'farmer'
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
      : role === 'consumer'
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'bg-amber-600 hover:bg-amber-500 text-white';

  const badgeStyle =
    role === 'farmer'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : role === 'consumer'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div
      className={cn(
        'w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all',
        className
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 tracking-tight">{vehicleId}</p>
              <p className="text-[11px] text-slate-500">Live Logistics Route</p>
            </div>
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', badgeStyle)}>
            {status}
          </span>
        </div>

        {/* Route Details */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-400 font-medium block text-[10px]">ORIGIN</span>
              <span className="text-slate-800 font-bold">{origin}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-400 font-medium block text-[10px]">DESTINATION</span>
              <span className="text-slate-800 font-bold">{destination}</span>
            </div>
          </div>
        </div>

        {/* Distance & Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Distance Traveled</span>
            <span>
              {distanceKm} / {totalDistanceKm} km ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                role === 'farmer'
                  ? 'bg-emerald-500'
                  : role === 'consumer'
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Updated {lastUpdated} • Low data mode saving ~1.2 MB map tiles</p>
        </div>
      </div>

      {/* On-Demand View Map Button */}
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className={cn(
          'w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer',
          buttonStyle
        )}
      >
        <Eye className="w-4 h-4" />
        <span>View Interactive Map</span>
      </button>
    </div>
  );
}
