'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTracking } from '@/context/TrackingContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import { DeliveryTracking } from '@/types/delivery';
import RouteMap from '@/components/maps/RouteMap';
import DeliveryStatusCard from '@/components/tracking/DeliveryStatusCard';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import DriverCard from '@/components/tracking/DriverCard';
import ColdChainTelemetryCard from '@/components/tracking/ColdChainTelemetryCard';
import ETACard from '@/components/tracking/ETACard';
import ProofOfDeliveryCard from '@/components/tracking/ProofOfDeliveryCard';
import {
  ArrowLeft,
  Truck,
  RotateCcw,
  Wifi,
} from 'lucide-react';

export default function ConsumerTrackingPage() {
  const params = useParams();
  const id = (params?.id as string) || 'TRK-CONS-ROAD-9021';
  const { activeTrip, setActiveTripId, refreshTrip } = useTracking();
  const { isLowBandwidth } = useBandwidth();
  const [localTrip, setLocalTrip] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTripId(id);
    sharedTrackingService.getTracking(id)
      .then((trip) => {
        setLocalTrip(trip);
      })
      .catch(() => {
        setLocalTrip(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, setActiveTripId]);

  const trip = (activeTrip && (activeTrip.id === id || activeTrip.tripId === id || activeTrip.orderId === id))
    ? activeTrip
    : localTrip;

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Truck className="w-12 h-12 mx-auto text-emerald-500 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Connecting to Highway Carrier Telemetry...
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Listening to live GPS and reefer sensor WebSocket updates.
        </p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Tracking Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tracking ID #{id} will show real-time shipment status once the carrier updates location.
        </p>
        <Link
          href="/consumer/orders"
          className="inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/consumer/orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" /> Realtime WebSocket Live
          </span>
          <button
            type="button"
            onClick={() => refreshTrip()}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title="Refresh state"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synchronized Delivery Status Header */}
      <DeliveryStatusCard
        status={trip.status}
        orderId={trip.orderId}
        tripId={trip.id}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <RouteMap trip={trip} isLowBandwidth={isLowBandwidth} />

          <ColdChainTelemetryCard telemetry={trip.telemetry} />

          {trip.proofOfDelivery && (
            <ProofOfDeliveryCard
              pod={trip.proofOfDelivery}
              orderId={trip.orderId}
              isDelivered={trip.status === 'DELIVERED'}
            />
          )}
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ETACard
            estimatedArrival={trip.estimatedArrival}
            distanceRemainingKm={trip.distanceRemainingKm}
            distanceCompletedKm={trip.distanceCompletedKm}
            totalDistanceKm={trip.totalDistanceKm}
            progressPercentage={trip.progressPercentage || 0}
            etaMinutes={trip.etaMinutes}
            currentLocationName={trip.currentLocationName}
          />

          <DriverCard
            driverName={trip.driverName}
            driverPhone={trip.driverPhone}
            vehicleType={trip.vehicleType}
            vehicleNumber={trip.vehicleNumber}
          />

          <TrackingTimeline
            waypoints={trip.waypoints}
            status={trip.status}
          />
        </div>
      </div>
    </div>
  );
}