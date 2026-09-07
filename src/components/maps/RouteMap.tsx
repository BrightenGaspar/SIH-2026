'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DeliveryTracking } from '@/types/delivery';
import { MapPin, Navigation } from 'lucide-react';

// Dynamically import Leaflet map with SSR turned off
const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
        Loading Highway GPS Coordinates & Road Route...
      </span>
    </div>
  ),
});

interface RouteMapProps {
  trip: DeliveryTracking;
  isLowBandwidth?: boolean;
}

export default function RouteMap({ trip, isLowBandwidth = false }: RouteMapProps) {
  if (isLowBandwidth) {
    return (
      <div className="w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Low Bandwidth Text Route Mode
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            Bandwidth Optimized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Current Road Position:</span>
            <strong className="text-white block mt-0.5 text-sm">{trip.currentLocationName}</strong>
            <span className="text-emerald-400 font-mono text-[11px] block mt-1">
              Coords: {trip.currentCoordinates[0]}° N, {trip.currentCoordinates[1]}° E
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Next Waypoint:</span>
            <strong className="text-white block mt-0.5 text-sm">
              {trip.waypoints.find((w) => !w.completed)?.title || 'Final Destination'}
            </strong>
            <span className="text-slate-400 text-[11px] block mt-1">
              Target Arrival: {trip.estimatedArrival}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <span className="text-slate-300">
            Route Progress: <strong className="text-white">{trip.progressPercentage}%</strong> ({trip.distanceRemainingKm} km remaining)
          </span>
          <span className="font-bold text-emerald-400">{trip.status}</span>
        </div>
      </div>
    );
  }

  return <LiveTrackingMap trip={trip} />;
}
