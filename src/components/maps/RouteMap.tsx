'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DeliveryTracking } from '@/types/delivery';
import { MapPin, PhoneCall, MessageSquare, AlertTriangle, Radio, Check, Copy, ShieldAlert } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const [showDesperateMode, setShowDesperateMode] = useState(false);

  const smsTrackingBody = `AGRIFLOW STATUS: Trip ${trip.id} | Vehicle: ${trip.vehicleNumber} | Cargo: ${trip.produceName} (${trip.totalQuantityKg}kg) | Driver: ${trip.driverName} (${trip.driverPhone}) | Last Point: ${trip.currentLocationName} | Status: ${trip.status} | ETA: ${trip.estimatedArrival}`;

  const handleCopySMS = () => {
    navigator.clipboard.writeText(smsTrackingBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLowBandwidth || showDesperateMode) {
    return (
      <div className="w-full p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {showDesperateMode ? 'Zero-Internet Emergency Fallback' : 'Low Bandwidth Text Route Mode'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Bandwidth Optimized
            </span>
            <button
              onClick={() => setShowDesperateMode(!showDesperateMode)}
              className={`text-[10px] px-2 py-0.5 rounded font-bold border transition ${
                showDesperateMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              {showDesperateMode ? 'Back to Text Data' : 'No Internet / GPS Down?'}
            </button>
          </div>
        </div>

        {/* 1. Normal Low-Bandwidth Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Current Highway Position:</span>
            <strong className="text-white block mt-0.5 text-sm">{trip.currentLocationName}</strong>
            <span className="text-emerald-400 font-mono text-[11px] block mt-1">
              Coords: {trip.currentCoordinates[0]}&deg; N, {trip.currentCoordinates[1]}&deg; E
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

        {/* 2. Route Progress summary */}
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <span className="text-slate-300">
            Route Progress: <strong className="text-white">{trip.progressPercentage}%</strong> ({trip.distanceRemainingKm} km remaining)
          </span>
          <span className="font-bold text-emerald-400">{trip.status}</span>
        </div>

        {/* 3. LAST DESPERATE RESORT / ZERO INTERNET / CELLULAR SMS & CALL FALLBACK */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/40 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
              Emergency Zero-Internet Fallback (Offline Telephony & SMS)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            If 2G mobile data drops completely in remote highway blindspots, use direct cellular cell-tower verification:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Direct Driver Call */}
            <a
              href={`tel:${trip.driverPhone || '+919876543210'}`}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 hover:bg-emerald-900/70 text-emerald-200 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold block truncate">Direct Call Driver</span>
                  <span className="text-[10px] text-emerald-400/80 block truncate">{trip.driverName} ({trip.driverPhone || '+91 98765 43210'})</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                Call Now
              </span>
            </a>

            {/* Offline SMS Gateway */}
            <a
              href={`sms:${trip.driverPhone || '+919876543210'}?body=${encodeURIComponent(smsTrackingBody)}`}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-900/40 border border-amber-500/40 hover:bg-amber-900/70 text-amber-200 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold block truncate">Offline SMS Dispatch</span>
                  <span className="text-[10px] text-amber-400/80 block truncate">Send tracking ping via text</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 shrink-0">
                Send SMS
              </span>
            </a>
          </div>

          {/* Copyable SMS Manifest */}
          <div className="pt-1 flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="truncate">{smsTrackingBody}</span>
            <button
              onClick={handleCopySMS}
              className="shrink-0 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-sans font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LiveTrackingMap trip={trip} />
      <div className="flex justify-end">
        <button
          onClick={() => setShowDesperateMode(true)}
          className="text-[11px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>GPS Blindspot? Switch to Zero-Internet SMS / Driver Call Fallback</span>
        </button>
      </div>
    </div>
  );
}
