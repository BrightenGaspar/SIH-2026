'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { logisticsService } from '@/services/logisticsService';
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

export default function LogisticsDashboard() {
  const { user, logisticsUser } = useAuth();
  const { isLowBandwidth } = useBandwidth();

  const [fleet, setFleet] = useState<LogisticsFleetVehicle[]>([]);
  const [trips, setTrips] = useState<ConsolidatedTrip[]>([]);
  const [manualRefreshing, setManualRefreshing] = useState(false);

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
  }, []);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    await loadData();
    setTimeout(() => setManualRefreshing(false), 500);
  };

  const activeVehicles = fleet.filter((v) => v.status === 'In Transit');
  const activeTripsCount = trips.filter((t) => t.status === 'IN TRANSIT').length || activeVehicles.length || 3;
  const primaryVehicle = fleet[0] || {
    id: 'FLEET-TS08UB4192',
    vehicleNumber: 'TS 08 UB 4192',
    vehicleType: 'Tata 407 Reefer',
    driverName: 'Mohammed Ismail',
    currentLocation: 'Shamshabad ORR Tollway',
    currentTempCelsius: 6.2,
    targetTempCelsius: 5.0,
    currentLoadKg: 1850,
    capacityKg: 2500,
    reeferActive: true,
    status: 'In Transit',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. LOW BANDWIDTH MODE BANNER */}
      <LowBandwidthBanner role="logistics" />

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
            <Radio className="w-3 h-3 animate-pulse" /> 3 Vehicles on highway
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">On Time Rate</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">98.4%</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            Zero SLA breaches today
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Distance Logged</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Navigation className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">420 km</div>
          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
            18 km saved via route optimization
          </span>
        </div>
      </div>

      {/* 4. RETURN LOAD AI HIGHLIGHT ALERT */}
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

      {/* 5. LIVE VEHICLE STATUS & TELEMETRY (Dual-Mode Normal vs Low Bandwidth) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
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
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Vehicle: {primaryVehicle.vehicleType} ({primaryVehicle.vehicleNumber}) &bull; Route: Shadnagar &rarr; Hyderabad
              </h3>
            </div>
          </div>

          <Link
            href={`/consumer/tracking/TRK-CONS-ROAD-9021`}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <MapPin className="w-3.5 h-3.5" /> Full Highway GPS <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Route Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Shadnagar Hub (0 km)</span>
            <span className="font-bold text-slate-900">68% Journey Completed</span>
            <span>Bowenpally Terminal (74 km)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full w-[68%] transition-all duration-500" />
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
                  <span className="text-base font-black text-emerald-600">6.2&deg;C</span>
                  <span className="text-[10px] text-slate-500">Target 5.0&deg;C</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">Optimal Range (4-8&deg;C)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Chamber Humidity</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-blue-600">88%</span>
                  <span className="text-[10px] text-slate-500">Relative</span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold block">Low Spoilage Risk</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Current Highway GPS</span>
                <span className="text-slate-900 font-bold text-xs block">Shamshabad Toll</span>
                <span className="text-amber-600 font-mono text-[10px] block">17.2403&deg; N, 78.4294&deg; E</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">Driver & Load Weight</span>
                <span className="text-slate-900 font-bold text-xs block">{primaryVehicle.driverName}</span>
                <span className="text-slate-600 text-[10px] block">1,850 kg / 2,500 kg (74%)</span>
              </div>
            </div>

            {/* Map on-demand container */}
            <LazyMap
              vehicleId="TRK-CONS-ROAD-9021"
              origin="Shadnagar Farm Hub"
              destination="Bowenpally Terminal"
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
          /* NORMAL MODE: Visual Route + Sensor Gauges (Reference design) */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Telemetry Sensor Gauges */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-emerald-600" /> Cold-Chain Telemetry
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live IoT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Temperature
                    </span>
                    <div className="text-2xl font-black text-emerald-600">6.2&deg;C</div>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Optimal (4-8&deg;C)
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Humidity
                    </span>
                    <div className="text-2xl font-black text-blue-600">88%</div>
                    <span className="text-[10px] text-blue-700 font-semibold block">
                      High Freshness
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                  <span>Reefer Compressor:</span>
                  <span className="text-emerald-600 font-bold">Continuous Cycling</span>
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
                    <strong className="text-slate-900 block text-xs mt-0.5">{primaryVehicle.driverName}</strong>
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
                    vehicleId="TRK-CONS-ROAD-9021"
                    origin="Shadnagar Farm Hub"
                    destination="Bowenpally Terminal"
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

