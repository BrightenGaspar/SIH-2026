'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { logisticsService } from '@/services/logisticsService';
import { supabase } from '@/lib/supabase';
import { LogisticsFleetVehicle, ConsolidatedTrip } from '@/types/logistics';
import { LowBandwidthBanner } from '@/components/common/LowBandwidthBanner';
import { LazyMap } from '@/components/maps/LazyMap';
import {
  Truck,
  Thermometer,
  RotateCcw,
  MapPin,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Radio,
  Clock,
  Droplets,
  Zap
} from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { LiveSimulationGraph } from '@/components/tracking/LiveSimulationGraph';
import { DriverDispatchModal } from '@/components/logistics/DriverDispatchModal';

export default function LogisticsDashboard() {
  const { user, logisticsUser } = useAuth();
  const { isLowBandwidth } = useBandwidth();

  const [fleet, setFleet] = useState<LogisticsFleetVehicle[]>([]);
  const [trips, setTrips] = useState<ConsolidatedTrip[]>([]);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // Live simulation state
  const [simulatedShipments, setSimulatedShipments] = useState<any[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('TRK-CONS-ROAD-9021');
  const [breachAlert, setBreachAlert] = useState<{
    id: string;
    message: string;
    temp: number;
    timestamp: number;
  } | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);

  // Dynamic user display name (NEVER hardcode reference demo names like Vikram)
  const displayName =
    logisticsUser?.name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Logistics Operator');

  const loadData = async () => {
    try {
      const [fleetData, tripsData] = await Promise.all([
        logisticsService.getFleet(),
        logisticsService.getTrips(),
      ]);
      setFleet(fleetData || []);
      setTrips(tripsData || []);
    } catch (err) {
      console.error('Failed to load logistics dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('realtime-logistics-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logistics_assignments' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Poll simulation status every 5 seconds
  useEffect(() => {
    let isMounted = true;

    const pollSimulation = async () => {
      try {
        const res = await fetch('/api/simulate/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const shipments: any[] = data.shipments || [];
        if (shipments.length > 0) {
          setSimulatedShipments(shipments);

          // Check for temperature breaches
          const breachedShipment = shipments.find(
            (s) => s.has_temperature_breach || Number(s.current_temp) > 8.0
          );

          if (breachedShipment) {
            const now = Date.now();
            // Debounce alert notifications by 15 seconds
            if (now - lastAlertTime > 15000) {
              setBreachAlert({
                id: breachedShipment.id,
                message: `⚠️ Temperature Breach Detected on Trip #${breachedShipment.id} (${Number(breachedShipment.current_temp).toFixed(1)}°C exceeds 8.0°C limit)`,
                temp: Number(breachedShipment.current_temp),
                timestamp: now,
              });
              setLastAlertTime(now);
            }
          }
        }
      } catch (err) {
        // Silently tolerate transient polling hiccups
      }
    };

    pollSimulation();
    const interval = setInterval(pollSimulation, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lastAlertTime]);

  const handleTriggerBreach = async (shipmentId: string) => {
    try {
      await fetch('/api/simulate/trigger-breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: shipmentId }),
      });
      setBreachAlert({
        id: shipmentId,
        message: `⚠️ Temperature Breach Detected on Trip #${shipmentId} (9.8°C exceeds 8.0°C limit)`,
        temp: 9.8,
        timestamp: Date.now(),
      });
      setLastAlertTime(Date.now());
    } catch (err) {
      console.error('Failed to trigger breach:', err);
    }
  };

  const handleReset = async (shipmentId: string) => {
    try {
      await fetch('/api/simulate/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: shipmentId }),
      });
      setBreachAlert(null);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    await loadData();
    setTimeout(() => setManualRefreshing(false), 500);
  };

  const activeSimulatedShipment =
    simulatedShipments.find((s) => s.id === selectedShipmentId) ||
    simulatedShipments[0] ||
    null;

  const activeVehicles = fleet.filter((v) => v.status === 'In Transit');
  const activeTripsCount = trips.filter((t) => t.status === 'IN TRANSIT').length;
  const primaryVehicle = fleet[0] || null;
  const totalDistanceLogged = trips.reduce((sum, t) => sum + (t.totalDistanceKm || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. LOW BANDWIDTH MODE BANNER */}
      <LowBandwidthBanner role="logistics" />

      {/* DRIVER DISPATCH NOTIFICATION & CASCADING RE-ROUTING MODAL */}
      <DriverDispatchModal onTripAccepted={() => loadData()} />

      {/* CRITICAL TEMPERATURE BREACH ALERT TOAST (Debounced) */}
      {breachAlert && (
        <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-lg border-2 border-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 text-amber-200 animate-bounce" />
            <div>
              <p className="font-black text-sm tracking-wide">{breachAlert.message}</p>
              <p className="text-xs text-rose-100">
                Automated reefer telematics anomaly broadcasted via IoT beacon. Spoilage risk is elevated!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => handleReset(breachAlert.id)}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 transition cursor-pointer"
            >
              Reset Setpoint
            </button>
            <button
              onClick={() => setBreachAlert(null)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. WELCOME HEADER (Matching reference visual replica) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Road Freight Command Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500">Hyderabad &bull; Perishable Corridors</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Welcome, {displayName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logistics Dashboard &bull; Track &bull; Deliver &bull; Keep Fresh
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLowBandwidth && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={manualRefreshing}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', manualRefreshing && 'animate-spin')} />
              <span>{manualRefreshing ? 'Refreshing...' : 'Manual Refresh'}</span>
            </button>
          )}

          <Link href="/logistics/trips">
            <button
              type="button"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Active Road Trips</span>
            </button>
          </Link>

          <Link href="/logistics/return-loads">
            <button
              type="button"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Return Load AI</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 3. 3 KPI METRIC CARDS (Exact match to reference layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Deliveries</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeTripsCount}</div>
          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
            <Radio className="w-3 h-3 animate-pulse" /> {activeTripsCount} active on highway
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Registered Fleet</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{fleet.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            Total active vehicles
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Distance Logged</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Navigation className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalDistanceLogged} km</div>
          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
            Across active corridors
          </span>
        </div>
      </div>

      {/* 4. RETURN LOAD AI HIGHLIGHT ALERT */}
      {primaryVehicle && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
              <AlertTriangle className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  AI Optimization Matched
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Bowenpally &rarr; Shadnagar Corridor
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">
                Empty Return Haul Matched (1,200 kg Organic Compost & Seedlings)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Driver {primaryVehicle.driverName} can earn <strong className="text-emerald-700 font-bold">+₹2,800 added revenue</strong> and avoid 68 km of empty deadhead miles.
              </p>
            </div>
          </div>

          <Link href="/logistics/return-loads" className="shrink-0 self-start sm:self-auto">
            <button
              type="button"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Accept Return Load</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      )}

      {/* SIMULATION ACTIVE TRIPS SWITCHER */}
      {simulatedShipments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Simulation Telemetry Streams ({simulatedShipments.length} Active Trips)
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              5s Auto-polling active &bull; Click to switch live view or inspect simulated breach trip
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {simulatedShipments.map((s) => {
              const isSelected = s.id === selectedShipmentId;
              const isBreach = s.has_temperature_breach || Number(s.current_temp) > 8.0;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedShipmentId(s.id)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border shadow-2xs',
                    isSelected
                      ? isBreach
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400'
                        : 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Truck className={cn('w-3.5 h-3.5', isBreach ? 'text-rose-600 animate-bounce' : 'text-amber-600')} />
                  <span>{s.id}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-black',
                      isBreach ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                    )}
                  >
                    {Number(s.current_temp).toFixed(1)}°C
                  </span>
                  {isBreach && <span className="text-[10px] text-rose-700 font-extrabold">(BREACH)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. LIVE VEHICLE STATUS & TELEMETRY (Dual-Mode Normal vs Low Bandwidth) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
              activeSimulatedShipment?.has_temperature_breach || Number(activeSimulatedShipment?.current_temp) > 8.0
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            )}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Live Vehicle Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  IoT Connected
                </span>
                {(activeSimulatedShipment?.has_temperature_breach || Number(activeSimulatedShipment?.current_temp) > 8.0) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    ⚠️ TEMP BREACH
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Vehicle: {activeSimulatedShipment?.vehicle_type || primaryVehicle.vehicleType} ({activeSimulatedShipment?.vehicle_number || primaryVehicle.vehicleNumber}) &bull; Route: {activeSimulatedShipment?.origin || 'Shadnagar'} &rarr; {activeSimulatedShipment?.destination || 'Hyderabad'}
              </h3>
            </div>
          </div>

          <Link
            href={`/consumer/tracking/${activeSimulatedShipment?.id || 'TRK-CONS-ROAD-9021'}`}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <MapPin className="w-3.5 h-3.5" /> Full Highway GPS <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Route Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{activeSimulatedShipment?.origin?.split(',')[0] || 'Shadnagar Hub'} (0 km)</span>
            <span className="font-bold text-slate-900">
              {Math.round((activeSimulatedShipment?.route_progress ?? 0.68) * 100)}% Journey Completed
            </span>
            <span>{activeSimulatedShipment?.destination?.split(',')[0] || 'Bowenpally Terminal'} (74 km)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                activeSimulatedShipment?.has_temperature_breach || Number(activeSimulatedShipment?.current_temp) > 8.0
                  ? "bg-rose-500"
                  : "bg-amber-500"
              )}
              style={{ width: `${Math.min(100, Math.max(5, Math.round((activeSimulatedShipment?.route_progress ?? 0.68) * 100)))}%` }}
            />
          </div>
        </div>

        {/* DUAL-MODE TELEMETRY & ROUTE PRESENTATION */}
        {isLowBandwidth ? (
          /* LOW BANDWIDTH MODE: Text-Only Summary & On-Demand Map */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Cold Chain Temperature</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-base font-black",
                    Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {Number(activeSimulatedShipment?.current_temp ?? 6.2).toFixed(1)}&deg;C
                  </span>
                  <span className="text-[10px] text-slate-500">Target {Number(activeSimulatedShipment?.target_temp ?? 5.0).toFixed(1)}&deg;C</span>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold block",
                  Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "text-rose-600 font-bold" : "text-emerald-600"
                )}>
                  {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "⚠️ Limit Breached (>8°C)" : "Optimal Range (2-8°C)"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Chamber Humidity</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-blue-600">{activeSimulatedShipment?.humidity ?? 88}%</span>
                  <span className="text-[10px] text-slate-500">Relative</span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold block">
                  {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "Elevated Spoilage Risk" : "Low Spoilage Risk"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Current Highway GPS</span>
                <span className="text-slate-900 font-bold text-xs block truncate">
                  {activeSimulatedShipment?.current_lat ? `${activeSimulatedShipment.current_lat}° N, ${activeSimulatedShipment.current_lng}° E` : 'Shamshabad Toll'}
                </span>
                <span className="text-amber-600 font-mono text-[10px] block">Live Satellite Link</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Driver & Load Weight</span>
                <span className="text-slate-900 font-bold text-xs block">{activeSimulatedShipment?.driver_name || primaryVehicle.driverName}</span>
                <span className="text-slate-600 text-[10px] block">1,850 kg / 2,500 kg (74%)</span>
              </div>
            </div>

            {/* Map on-demand container */}
            <LazyMap
              vehicleId={activeSimulatedShipment?.id || "TRK-CONS-ROAD-9021"}
              origin={activeSimulatedShipment?.origin || "Shadnagar Farm Hub"}
              destination={activeSimulatedShipment?.destination || "Bowenpally Terminal"}
              distanceKm={46}
              totalDistanceKm={74}
              status="In Transit"
              role="logistics"
            >
              <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 text-xs">
                <div className="text-center space-y-1">
                  <MapPin className="w-6 h-6 text-amber-500 mx-auto" />
                  <span className="font-semibold text-slate-700 block">Interactive Live GPS Route Map</span>
                  <span className="text-[11px] text-slate-500 block">Live coordinates updating via satellite beacon</span>
                </div>
              </div>
            </LazyMap>
          </div>
        ) : (
          /* NORMAL MODE: Visual Route + Sensor Gauges + Live Recharts Temperature Graph */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Telemetry Sensor Gauges */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-emerald-600" /> Cold-Chain Telemetry
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0
                      ? "bg-rose-100 text-rose-800 animate-pulse"
                      : "bg-emerald-100 text-emerald-800"
                  )}>
                    {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "Breach Active" : "Live IoT"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Temperature
                    </span>
                    <div className={cn(
                      "text-2xl font-black",
                      Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {Number(activeSimulatedShipment?.current_temp ?? 6.2).toFixed(1)}&deg;C
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold block",
                      Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "text-rose-600 font-bold" : "text-emerald-700"
                    )}>
                      {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "Limit Breached (>8°C)" : "Optimal (2-8°C)"}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Humidity
                    </span>
                    <div className="text-2xl font-black text-blue-600">{activeSimulatedShipment?.humidity ?? 88}%</div>
                    <span className="text-[10px] text-blue-700 font-semibold block">
                      {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "Spoilage Warning" : "High Freshness"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                  <span>Reefer Compressor:</span>
                  <span className={cn(
                    "font-bold",
                    Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {Number(activeSimulatedShipment?.current_temp ?? 6.2) > 8.0 ? "Compressor Strain / Alarm" : "Continuous Cycling"}
                  </span>
                </div>
              </div>

              {/* Highway Position & Vehicle Specs */}
              <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" /> Highway Route Status
                  </span>
                  <span className="text-[11px] text-slate-500">ETA: Today, 05:45 PM (45 mins)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Assigned Driver</span>
                    <strong className="text-slate-900 block text-xs mt-0.5 truncate">{activeSimulatedShipment?.driver_name || primaryVehicle.driverName}</strong>
                    <span className="text-[10px] text-slate-500">Verified Carrier</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Current Payload</span>
                    <strong className="text-slate-900 block text-xs mt-0.5">1,850 / 2,500 kg</strong>
                    <span className="text-[10px] text-amber-600 font-semibold">74% Capacity</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Remaining Distance</span>
                    <strong className="text-slate-900 block text-xs mt-0.5">28 km</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold">Express Corridor</span>
                  </div>
                </div>

                <div className="pt-2">
                  <LazyMap
                    vehicleId={activeSimulatedShipment?.id || "TRK-CONS-ROAD-9021"}
                    origin={activeSimulatedShipment?.origin || "Shadnagar Farm Hub"}
                    destination={activeSimulatedShipment?.destination || "Bowenpally Terminal"}
                    distanceKm={46}
                    totalDistanceKm={74}
                    status="In Transit"
                    role="logistics"
                  >
                    <div className="w-full h-36 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 text-xs">
                      <div className="text-center space-y-1">
                        <MapPin className="w-5 h-5 text-amber-500 mx-auto" />
                        <span className="font-semibold text-slate-700 block">Interactive Live GPS Route Map</span>
                        <span className="text-[10px] text-slate-500 block">Tracking vehicle on NH 44 corridor</span>
                      </div>
                    </div>
                  </LazyMap>
                </div>
              </div>
            </div>

            {/* Live Recharts Temperature Graph with 8°C Spoilage Threshold Line */}
            <LiveSimulationGraph
              shipmentId={activeSimulatedShipment?.id || 'TRK-CONS-ROAD-9021'}
              vehicleNumber={activeSimulatedShipment?.vehicle_number || primaryVehicle.vehicleNumber}
              currentTemp={Number(activeSimulatedShipment?.current_temp ?? 5.8)}
              targetTemp={Number(activeSimulatedShipment?.target_temp ?? 5.0)}
              history={activeSimulatedShipment?.temp_history || []}
              hasBreach={Boolean(activeSimulatedShipment?.has_temperature_breach || (activeSimulatedShipment?.current_temp && Number(activeSimulatedShipment.current_temp) > 8.0))}
              onTriggerBreach={() => handleTriggerBreach(activeSimulatedShipment?.id || 'TRK-CONS-ROAD-9021')}
              onReset={() => handleReset(activeSimulatedShipment?.id || 'TRK-CONS-ROAD-9021')}
            />
          </div>
        )}
      </div>

      {/* 6. DEDICATED ROAD FLEET LIST (Dual-Mode: Visual vs Text Only) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              {isLowBandwidth ? 'Fleet Status (Text Only)' : 'Dedicated Road Vehicle Fleet & Live Status'}
            </h3>
            {isLowBandwidth && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-600" /> Text Mode Active
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {fleet.length} Vehicles in Regional Operations
          </span>
        </div>

        {isLowBandwidth ? (
          /* LOW BANDWIDTH MODE: Clean Text-Only Table */
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Vehicle / Reg #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Load (kg)</th>
                    <th className="py-3 px-4">Reefer Temp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fleet.map((veh) => (
                    <tr key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block font-mono">{veh.vehicleNumber}</span>
                        <span className="text-[10px] text-slate-500">{veh.currentLocation}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{veh.vehicleType}</td>
                      <td className="py-3 px-4 text-slate-700">{veh.driverName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {veh.currentLoadKg} / {veh.capacityKg} kg
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-600">
                          {veh.reeferActive ? `${veh.currentTempCelsius}°C` : 'Ambient'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold',
                            veh.status === 'In Transit'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          )}
                        >
                          {veh.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/consumer/tracking/${veh.assignedTripId || 'TRK-CONS-ROAD-9021'}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition"
                        >
                          Telemetry
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* NORMAL MODE: Visual Fleet Cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fleet.map((veh) => (
              <div
                key={veh.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{veh.vehicleType}</h4>
                      <span className="font-mono text-xs font-bold text-slate-500">{veh.vehicleNumber}</span>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                        veh.status === 'In Transit'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      )}
                    >
                      {veh.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver:</span>
                      <strong className="text-slate-900 font-semibold">{veh.driverName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Load:</span>
                      <strong className="text-slate-900 font-semibold">
                        {veh.currentLoadKg} / {veh.capacityKg} kg
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cold Chain:</span>
                      <span className="font-bold text-emerald-600">
                        {veh.reeferActive ? `Active (${veh.currentTempCelsius}°C)` : 'Ambient'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Hub:</span>
                      <span className="truncate max-w-[140px] font-medium text-slate-700">
                        {veh.currentLocation}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Link href={`/consumer/tracking/${veh.assignedTripId || 'TRK-CONS-ROAD-9021'}`}>
                    <button
                      type="button"
                      className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-500" />
                      <span>Live Highway Telemetry</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

