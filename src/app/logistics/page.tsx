'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  MapPin, 
  ThermometerSnowflake, 
  RotateCcw, 
  ArrowRight, 
  Activity, 
  Radio,
  TrendingUp
} from 'lucide-react';
import { DeliveryTracking } from '@/types/delivery';
import { sharedTrackingService, defaultMockDeliveryTrip } from '@/services/sharedTrackingService';
import RouteMap from '@/components/maps/RouteMap';
import ColdChainTelemetryCard from '@/components/tracking/ColdChainTelemetryCard';
import DeliveryStatusCard from '@/components/tracking/DeliveryStatusCard';
import DriverCard from '@/components/tracking/DriverCard';
import ETACard from '@/components/tracking/ETACard';
import ProofOfDeliveryCard from '@/components/tracking/ProofOfDeliveryCard';
import ReturnLoadCard from '@/components/tracking/ReturnLoadCard';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';

export default function LogisticsDashboardPage() {
  const [trip, setTrip] = useState<DeliveryTracking>(defaultMockDeliveryTrip);
  const [simulatedTemp, setSimulatedTemp] = useState<number>(5.8);

  useEffect(() => {
    sharedTrackingService.getTracking('TRK-CONS-ROAD-9021').then((res) => {
      if (res) setTrip(res);
    });
  }, []);

  const handleTempChange = (newTemp: number) => {
    setSimulatedTemp(newTemp);
    setTrip((prev) => ({
      ...prev,
      telemetry: {
        ...prev.telemetry,
        temperatureCelsius: newTemp,
        spoilageRisk: newTemp > 12 ? 'HIGH' : newTemp > 8 ? 'MEDIUM' : 'LOW',
        safeWindowHours: newTemp > 12 ? 1 : newTemp > 8 ? 2 : 4,
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Fleet KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Reefer Fleet</span>
            <div className="text-2xl font-black text-white mt-1">14 <span className="text-xs text-emerald-400 font-normal">Vehicles</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">IoT Cold Integrity</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">99.4% <span className="text-xs text-slate-400 font-normal">In-Range</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Return Load Match</span>
            <div className="text-2xl font-black text-white mt-1">82% <span className="text-xs text-cyan-400 font-normal">Utilization</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Carrier Profit Boost</span>
            <div className="text-2xl font-black text-teal-400 mt-1">+₹3,400 <span className="text-xs text-slate-400 font-normal">/trip</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Trip Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" /> LIVE GPS & SENSOR STREAM
            </span>
            <span className="text-xs text-slate-400 font-mono">Trip ID: {trip.tripId}</span>
          </div>
          <h1 className="text-2xl font-black text-white">{trip.produceName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {trip.pickupLocation} → {trip.destinationLocation}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current Status</span>
            <span className="text-sm font-bold text-emerald-400">{trip.status}</span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <Link
            href="/consumer/tracking/TRK-CONS-ROAD-9021"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950"
          >
            <span>Buyer View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Telemetry Simulator Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Reefer IoT Sensor Simulation</span>
            <span className="text-[11px] text-slate-400">Drag temperature slider to test real-time spoilage window calculation</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <span className="text-xs font-mono font-bold text-cyan-400">{simulatedTemp.toFixed(1)}°C</span>
          <input
            type="range"
            min="2"
            max="18"
            step="0.5"
            value={simulatedTemp}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-48 accent-cyan-500 cursor-pointer"
          />
          <button
            onClick={() => handleTempChange(5.8)}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Grid: Live Map & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route Map & Timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">Live Highway Route (NH 44 & ORR)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {trip.distanceCompletedKm} / {trip.totalDistanceKm} km ({trip.progressPercentage}%)
              </span>
            </div>
            <div className="h-[420px] w-full relative">
              <RouteMap trip={trip} />
            </div>
          </div>

          {/* Delivery & Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DeliveryStatusCard 
              status={trip.status} 
              orderId={trip.orderId} 
              tripId={trip.tripId} 
            />
            <TrackingTimeline 
              waypoints={trip.waypoints} 
              status={trip.status} 
            />
          </div>
        </div>

        {/* Right Column: Telemetry, Driver & Return Load (1 col) */}
        <div className="space-y-6">
          <ColdChainTelemetryCard telemetry={trip.telemetry} />
          <ETACard 
            estimatedArrival={trip.estimatedArrival}
            etaMinutes={trip.etaMinutes}
            distanceRemainingKm={trip.distanceRemainingKm}
            distanceCompletedKm={trip.distanceCompletedKm}
            totalDistanceKm={trip.totalDistanceKm}
            progressPercentage={trip.progressPercentage}
            currentLocationName={trip.currentLocationName}
          />
          <DriverCard 
            driverName={trip.driverName}
            driverPhone={trip.driverPhone}
            vehicleType={trip.vehicleType}
            vehicleNumber={trip.vehicleNumber}
          />
          {trip.returnLoad && <ReturnLoadCard returnLoad={trip.returnLoad} />}
          {trip.proofOfDelivery && (
            <ProofOfDeliveryCard 
              pod={trip.proofOfDelivery} 
              orderId={trip.orderId} 
              isDelivered={trip.status === 'DELIVERED'} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
