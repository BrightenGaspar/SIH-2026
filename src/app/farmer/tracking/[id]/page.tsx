'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trackingService } from '@/services/trackingService';
import { RoadLogisticsTracking } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Truck,
  ArrowLeft,
  Thermometer,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Phone
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function RoadTrackingPage() {
  const params = useParams();
  const id = (params?.id as string) || 'TRK-RD-9021';
  const [tracking, setTracking] = useState<RoadLogisticsTracking | null>(null);

  useEffect(() => {
    trackingService.getTrackingDetails(id).then(setTracking);
  }, [id]);

  if (!tracking) {
    return (
      <div className="py-16 text-center space-y-4">
        <Truck className="w-12 h-12 mx-auto text-slate-400 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Loading Road Logistics Telemetry...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <div>
        <Link href="/farmer/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-400 font-bold">{tracking.id}</span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ROAD FREIGHT ONLY
            </span>
            <StatusBadge status={tracking.status} />
          </div>
          <h1 className="text-2xl font-black text-white">{tracking.pickupLocation} → {tracking.destinationLocation}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Carrier: <strong className="text-white">{tracking.vehicleType} ({tracking.vehicleNumber})</strong> • Driver: {tracking.driverName}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Estimated Arrival (ETA)</span>
          <span className="text-xl font-black text-emerald-400">{tracking.estimatedArrival}</span>
        </div>
      </div>

      {/* Road Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Cold chain card */}
        <Card className="bg-slate-900 border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-emerald-400" /> Cold-Chain Telemetry
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Simulated GPS</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{tracking.spoilageTelemetry.temperatureCelsius}°C</div>
          <p className="text-xs text-slate-400 mt-1">
            Target: {tracking.spoilageTelemetry.targetTempCelsius}°C • Humidity: {tracking.spoilageTelemetry.humidityPercent}%
          </p>
        </Card>

        {/* Safe Window */}
        <Card className="bg-slate-900 border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Spoilage Safe Window
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Low Risk</span>
          </div>
          <div className="text-2xl font-black text-white">
            {tracking.spoilageTelemetry.safeWindowHours}h {tracking.spoilageTelemetry.safeWindowMinutes}m
          </div>
          <p className="text-xs text-slate-400 mt-1">Produce fresh shelf-life under Reefer transit.</p>
        </Card>

        {/* Route Progress */}
        <Card className="bg-slate-900 border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" /> Road Route Progress
            </span>
            <span className="text-[10px] font-bold text-emerald-400">{tracking.progressPercent}% Complete</span>
          </div>
          <div className="text-2xl font-black text-white">{tracking.distanceRemainingKm} km remaining</div>
          <p className="text-xs text-slate-400 mt-1">Total Trip Distance: {tracking.totalDistanceKm} km</p>
        </Card>

      </div>

      {/* Waypoint Timeline */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-white mb-6">Road Waypoint Progression</h3>
        <div className="space-y-6">
          {tracking.timeline.map((point, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                point.completed
                  ? point.current
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                    : 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {point.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="flex-1 pb-4 border-b border-slate-800 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{point.title}</span>
                  <span className="text-xs font-mono text-slate-400">{point.timestamp}</span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">{point.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Return Load Matching Demo Opportunity */}
      {tracking.returnLoad && (
        <Card variant="emerald" className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300">Return Load Matching Available</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Demo Simulation</span>
                </div>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {tracking.returnLoad.origin} → {tracking.returnLoad.destination}
                </h4>
                <p className="text-xs text-slate-300">
                  Cargo: {tracking.returnLoad.commodity} • Avoids {tracking.returnLoad.emptyDistanceAvoidedKm} km empty return run.
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs text-slate-400 block">Additional Carrier Earnings</span>
              <span className="text-lg font-black text-emerald-400">+{formatINR(tracking.returnLoad.additionalEarnings)}</span>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
