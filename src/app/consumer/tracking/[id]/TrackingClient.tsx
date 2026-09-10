'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { trackingService } from '@/services/trackingService';
import { RoadLogisticsTracking } from '@/types/farmer';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ArrowLeft, Thermometer, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export default function TrackingClient() {
  const params = useParams();
  const id = (params?.id as string) || 'TRK-RD-9021';
  const [tracking, setTracking] = useState<RoadLogisticsTracking | null>(null);

  useEffect(() => {
    trackingService.getTrackingDetails(id).then(setTracking);
  }, [id]);

  if (!tracking) {
    return <div className="p-12 text-center text-slate-400">Loading delivery telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/consumer/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-400 font-bold">{tracking.id}</span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
              INCOMING COLD FREIGHT
            </span>
            <StatusBadge status={tracking.status} />
          </div>
          <h1 className="text-2xl font-black">{tracking.pickupLocation} &rarr; {tracking.destinationLocation}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Vehicle: <strong className="text-white">{tracking.vehicleType} ({tracking.vehicleNumber})</strong> &bull; Driver: {tracking.driverName}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Estimated Arrival (ETA)</span>
          <span className="text-xl font-black text-blue-400">{tracking.estimatedArrival}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-slate-900 border-slate-800 text-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-blue-400" /> Cold-Chain Climate
          </span>
          <div className="text-2xl font-black text-blue-400 mt-2">{tracking.spoilageTelemetry.temperatureCelsius}°C</div>
          <span className="text-[10px] text-slate-400">Target: {tracking.spoilageTelemetry.targetTempCelsius}&deg;C &bull; Low Spoilage Risk</span>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800 text-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Safe Freshness Window
          </span>
          <div className="text-2xl font-black text-white mt-2">{tracking.spoilageTelemetry.safeWindowHours}h {tracking.spoilageTelemetry.safeWindowMinutes}m</div>
          <span className="text-[10px] text-slate-400">Humidity: {tracking.spoilageTelemetry.humidityPercent}% RH</span>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800 text-white">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" /> Highway Progress
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2">{tracking.progressPercent}% Complete</div>
          <span className="text-[10px] text-slate-400">{tracking.distanceRemainingKm} km remaining of {tracking.totalDistanceKm} km</span>
        </Card>
      </div>

      {/* Waypoints */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Highway Waypoint Progression</h3>
        <div className="space-y-5">
          {tracking.timeline.map((point, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                point.completed
                  ? point.current
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                    : 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {point.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{point.title}</span>
                  <span className="text-xs font-mono text-slate-400">{point.timestamp}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{point.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
