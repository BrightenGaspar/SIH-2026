'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  MapPin, 
  ThermometerSnowflake, 
  ArrowRight, 
  Activity, 
  AlertTriangle,
  Radio,
  AlertCircle
} from 'lucide-react';
import { DeliveryTracking } from '@/types/delivery';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import RouteMap from '@/components/maps/RouteMap';
import ColdChainTelemetryCard from '@/components/tracking/ColdChainTelemetryCard';
import DeliveryStatusCard from '@/components/tracking/DeliveryStatusCard';
import DriverCard from '@/components/tracking/DriverCard';
import ETACard from '@/components/tracking/ETACard';
import ProofOfDeliveryCard from '@/components/tracking/ProofOfDeliveryCard';
import ReturnLoadCard from '@/components/tracking/ReturnLoadCard';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import { DriverDispatchModal } from '@/components/logistics/DriverDispatchModal';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';
import { supabase } from '@/lib/supabase';

export default function LogisticsDashboardPage() {
  const [trips, setTrips] = useState<DeliveryTracking[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load real trips from Supabase
  const loadTrips = async () => {
    try {
      setLoading(true);
      const all = await sharedTrackingService.getAllTrips();
      setTrips(all);
      if (all.length > 0 && !selectedTripId) {
        setSelectedTripId(all[0].id);
      }
    } catch (err) {
      console.warn('Error loading logistics trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();

    // Realtime Supabase Channel
    const channel = supabase
      .channel('logistics-trips-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logistics_trips' },
        () => {
          loadTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-4 sm:p-6 font-sans">
      {/* Driver Dispatch Modal for incoming orders */}
      <DriverDispatchModal onTripAccepted={() => loadTrips()} />

      {/* Top Banner & Telemetry Gateway Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Logistics Control Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-mono">Fleet Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Active Freight Corridors
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time GPS routing, cold-chain temperature surveillance, and empty return-load optimization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/logistics/telemetry"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry Console</span>
          </Link>
          <Link
            href="/logistics/return-loads"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            Return Loads
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading live logistics fleet...</p>
        </div>
      )}

      {/* Honest Empty State: No active shipments */}
      {!loading && !activeTrip && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            No Active Shipments
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            There are currently no freight trips dispatched or in transit. When a consumer order is confirmed and accepted by a driver, live vehicle telemetry and route tracking will appear here.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/consumer/marketplace"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              Go to Marketplace
            </Link>
          </div>
        </div>
      )}

      {/* Active Shipment Display */}
      {!loading && activeTrip && (
        <>
          {/* Trip Selector (when multiple exist) */}
          {trips.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Active Hauls:</span>
              {trips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTripId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer border ${
                    t.id === activeTrip.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.vehicleNumber} ({t.produceName.slice(0, 16)}...)
                </button>
              ))}
            </div>
          )}

          {/* Active Trip Header */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DataStatusBadge
                  status="LIVE"
                  source="Supabase Telemetry Engine"
                  showSource={true}
                />
                <span className="text-xs text-slate-500 font-mono">Trip ID: {activeTrip.tripId}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{activeTrip.produceName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {activeTrip.pickupLocation} &rarr; {activeTrip.destinationLocation}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="text-sm font-bold text-emerald-600">{activeTrip.status}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <Link
                href={`/consumer/tracking/${activeTrip.id}`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Buyer View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
                    <span className="text-sm font-bold text-white">Live Route & Vehicle GPS</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeTrip.distanceCompletedKm} / {activeTrip.totalDistanceKm} km ({activeTrip.progressPercentage}%)
                  </span>
                </div>
                <div className="h-[420px] w-full relative">
                  {activeTrip.currentCoordinates ? (
                    <RouteMap trip={activeTrip} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No live GPS telemetry available
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery & Timeline Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DeliveryStatusCard 
                  status={activeTrip.status} 
                  orderId={activeTrip.orderId} 
                  tripId={activeTrip.tripId} 
                />
                <TrackingTimeline 
                  waypoints={activeTrip.waypoints} 
                  status={activeTrip.status} 
                />
              </div>
            </div>

            {/* Right Column: Telemetry, Driver & Return Load (1 col) */}
            <div className="space-y-6">
              <ColdChainTelemetryCard telemetry={activeTrip.telemetry} />
              <ETACard 
                estimatedArrival={activeTrip.estimatedArrival}
                etaMinutes={activeTrip.etaMinutes}
                distanceRemainingKm={activeTrip.distanceRemainingKm}
                distanceCompletedKm={activeTrip.distanceCompletedKm}
                totalDistanceKm={activeTrip.totalDistanceKm}
                progressPercentage={activeTrip.progressPercentage}
                currentLocationName={activeTrip.currentLocationName}
              />
              <DriverCard 
                driverName={activeTrip.driverName}
                driverPhone={activeTrip.driverPhone}
                vehicleType={activeTrip.vehicleType}
                vehicleNumber={activeTrip.vehicleNumber}
              />
              {activeTrip.returnLoad && <ReturnLoadCard returnLoad={activeTrip.returnLoad} />}
              {activeTrip.proofOfDelivery && (
                <ProofOfDeliveryCard 
                  pod={activeTrip.proofOfDelivery} 
                  orderId={activeTrip.orderId} 
                  isDelivered={activeTrip.status === 'DELIVERED'} 
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
