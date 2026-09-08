'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import { DeliveryTracking } from '@/types/delivery';
import { useBandwidth } from '@/context/BandwidthContext';
import RouteMap from '@/components/maps/RouteMap';
import DeliveryStatusCard from '@/components/tracking/DeliveryStatusCard';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import DriverCard from '@/components/tracking/DriverCard';
import ColdChainTelemetryCard from '@/components/tracking/ColdChainTelemetryCard';
import ETACard from '@/components/tracking/ETACard';
import ProofOfDeliveryCard from '@/components/tracking/ProofOfDeliveryCard';
import {
  Truck,
  Search,
  Navigation,
  Radio,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Thermometer,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Wifi,
  Share2,
  Copy,
  Check
} from 'lucide-react';

function ConsumerTrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || 'TRK-CONS-ROAD-9021';

  const { isLowBandwidth, toggleLowBandwidth } = useBandwidth();
  const [trips, setTrips] = useState<DeliveryTracking[]>([]);
  const [activeTrip, setActiveTrip] = useState<DeliveryTracking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Live GPS Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadTrips() {
      setLoading(true);
      const allTrips = await sharedTrackingService.getAllTrips();
      setTrips(allTrips);

      // Select initial trip
      const found = allTrips.find(
        (t) =>
          t.id.toUpperCase() === initialId.toUpperCase() ||
          t.tripId.toUpperCase() === initialId.toUpperCase() ||
          t.orderId.toUpperCase() === initialId.toUpperCase()
      ) || allTrips[0];

      setActiveTrip(found);
      setLoading(false);
    }
    loadTrips();
  }, [initialId]);

  // Handle Live GPS simulation
  useEffect(() => {
    if (!isSimulating || !activeTrip || !activeTrip.routeCoordinates || activeTrip.routeCoordinates.length === 0) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      return;
    }

    simulationTimerRef.current = setInterval(() => {
      setSimIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeTrip.routeCoordinates.length;
        const nextCoords = activeTrip.routeCoordinates[nextIndex];
        const progress = Math.round(((nextIndex + 1) / activeTrip.routeCoordinates.length) * 100);
        const remKm = Math.max(0, Math.round(activeTrip.totalDistanceKm * (1 - progress / 100)));
        const compKm = activeTrip.totalDistanceKm - remKm;

        setActiveTrip((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentCoordinates: nextCoords,
            progressPercentage: progress,
            distanceRemainingKm: remKm,
            distanceCompletedKm: compKm,
            etaMinutes: Math.max(5, Math.round(remKm * 1.6)),
            currentLocationName:
              nextIndex === 0
                ? prev.pickupLocation
                : nextIndex === activeTrip.routeCoordinates.length - 1
                ? prev.destinationLocation
                : `Highway GPS Checkpoint ${nextIndex + 1} (Moving @ 54 km/h)`,
          };
        });

        return nextIndex;
      });
    }, 2800);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [isSimulating, activeTrip?.id]);

  const handleSelectTrip = (trip: DeliveryTracking) => {
    setIsSimulating(false);
    setSimIndex(0);
    setActiveTrip(trip);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toUpperCase();
    const found = trips.find(
      (t) =>
        t.id.toUpperCase().includes(query) ||
        t.tripId.toUpperCase().includes(query) ||
        t.orderId.toUpperCase().includes(query) ||
        t.vehicleNumber.toUpperCase().includes(query) ||
        t.produceName.toUpperCase().includes(query)
    );

    if (found) {
      handleSelectTrip(found);
    } else {
      sharedTrackingService.getTracking(query).then((trip) => {
        if (trip) handleSelectTrip(trip);
      });
    }
  };

  const handleCopyShareLink = () => {
    if (!activeTrip) return;
    const url = `${window.location.origin}/consumer/tracking/${activeTrip.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Connecting to Road GPS Satellite & IoT Carrier Stream...
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Fetching live coordinates, reefer temperature telemetry, and waypoints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" /> Live GPS Road Freight Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Delivery Tracking by GPS
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time highway position, driver speed, and IoT temperature monitoring for your farm produce.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLowBandwidth}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 ${
              isLowBandwidth
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Wifi className="w-4 h-4" />
            {isLowBandwidth ? 'Low Bandwidth: ON' : 'Standard Map Mode'}
          </button>

          {activeTrip && (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Copy live tracking link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> Share Link
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Tracking ID (e.g. TRK-CONS-ROAD-9021), Order ID, Vehicle Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Track
          </button>
        </form>

        {/* Sample ID Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Quick Select Shipments:</span>
          {trips.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTrip(t)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors border ${
                activeTrip?.id === t.id
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
              }`}
            >
              {t.id} • {t.produceName.split('(')[0].trim()} ({t.status})
            </button>
          ))}
        </div>
      </div>

      {activeTrip && (
        <>
          {/* Active Shipments Switcher Cards Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trips.map((trip) => {
              const isSelected = activeTrip.id === trip.id;
              const isDelivered = trip.status === 'DELIVERED';

              return (
                <div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  className={`cursor-pointer p-4 rounded-3xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-zinc-400 block">
                        {trip.id} • {trip.vehicleNumber}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                        {trip.produceName}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{trip.currentLocationName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <span>
                        ETA: <strong className="text-zinc-900 dark:text-white">{trip.estimatedArrival}</strong>
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {trip.progressPercentage}%
                      </span>
                    </div>

                    {/* Progress mini bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${trip.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synchronized Delivery Status Header */}
          <DeliveryStatusCard
            status={activeTrip.status}
            orderId={activeTrip.orderId}
            tripId={activeTrip.id}
          />

          {/* Live GPS Simulation & Telemetry Controls Strip */}
          <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/30 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Navigation className={`w-5 h-5 ${isSimulating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    GPS Highway Telemetry Stream
                  </span>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {isSimulating ? 'Live Motion Simulated' : 'Satellite Connected'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-mono mt-0.5">
                  Coords: {activeTrip.currentCoordinates[0].toFixed(4)}° N, {activeTrip.currentCoordinates[1].toFixed(4)}° E • Speed: {isSimulating ? '58 km/h' : '52 km/h'}
                </p>
              </div>
            </div>

            {/* Simulation Play/Pause buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                  isSimulating
                    ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause GPS Stream
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Simulate Live Movement
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSimulating(false);
                  setSimIndex(0);
                  sharedTrackingService.getTracking(activeTrip.id).then((t) => {
                    if (t) setActiveTrip(t);
                  });
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Grid: Left Map & Reefer Telemetry, Right ETACard, Driver, Waypoints */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Leaflet Route Map */}
              <RouteMap trip={activeTrip} isLowBandwidth={isLowBandwidth} />

              {/* Cold Chain IoT Reefer Telemetry */}
              <ColdChainTelemetryCard telemetry={activeTrip.telemetry} />

              {/* Proof of Delivery Card (if available or delivered) */}
              {activeTrip.proofOfDelivery && (
                <ProofOfDeliveryCard
                  pod={activeTrip.proofOfDelivery}
                  orderId={activeTrip.orderId}
                  isDelivered={activeTrip.status === 'DELIVERED'}
                />
              )}
            </div>

            {/* Right Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* ETA, Remaining Km, Progress Card */}
              <ETACard
                estimatedArrival={activeTrip.estimatedArrival}
                distanceRemainingKm={activeTrip.distanceRemainingKm}
                distanceCompletedKm={activeTrip.distanceCompletedKm}
                totalDistanceKm={activeTrip.totalDistanceKm}
                progressPercentage={activeTrip.progressPercentage || 0}
                etaMinutes={activeTrip.etaMinutes}
                currentLocationName={activeTrip.currentLocationName}
              />

              {/* Driver and Vehicle Telematics */}
              <DriverCard
                driverName={activeTrip.driverName}
                driverPhone={activeTrip.driverPhone}
                vehicleType={activeTrip.vehicleType}
                vehicleNumber={activeTrip.vehicleNumber}
              />

              {/* Waypoints Timeline */}
              <TrackingTimeline
                waypoints={activeTrip.waypoints}
                status={activeTrip.status}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ConsumerTrackingHubPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Loading GPS Telemetry...</p>
        </div>
      }
    >
      <ConsumerTrackingContent />
    </Suspense>
  );
}
