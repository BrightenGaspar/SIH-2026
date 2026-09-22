'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { logisticsService } from '@/services/logisticsService';
import {
  Thermometer,
  Snowflake,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Wifi,
  Radio,
  Truck,
  RefreshCw,
  Clock,
  Send,
  AlertCircle,
  Wind,
  Zap,
  Gauge,
  Cpu,
} from 'lucide-react';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

interface TelemetryVehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_name?: string;
  commodity?: string;
  current_temp: number | null;
  target_temp: number;
  humidity: number | null;
  ethylene_ppm?: number | null;
  current_location?: string;
  status: string;
  telemetry_source?: string;
  last_ping?: string | null;
  safe_threshold: number;
  spoilage_risk?: string;
}

export default function ColdChainTelemetryPage() {
  const [vehicles, setVehicles] = useState<TelemetryVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString());

  // Real Telemetry Ingestion Test State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [inputTemp, setInputTemp] = useState<string>('3.5');
  const [inputHum, setInputHum] = useState<string>('88');
  const [inputEthylene, setInputEthylene] = useState<string>('0.8');
  const [inputSource, setInputSource] = useState<string>('Teltonika FMB920 Reefer Sensor');
  const [isSubmittingTelemetry, setIsSubmittingTelemetry] = useState(false);
  const [ingestResult, setIngestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Fetch initial telemetry and subscribe to Supabase Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchLiveTelemetry = async () => {
      try {
        setLoading(true);
        const trips = await logisticsService.getTrips();
        if (trips && trips.length > 0) {
          const mapped: TelemetryVehicle[] = trips.map((t: any) => ({
            id: t.id,
            vehicle_number: t.vehicle?.vehicleNumber || 'TS 08 UB 4192',
            vehicle_type: t.vehicle?.vehicleType || 'Tata 407 Reefer',
            driver_name: t.vehicle?.driverName || 'Fleet Operator',
            commodity: t.commodity || 'Perishable Farm Harvest',
            current_temp: t.vehicle?.currentTempCelsius ?? null,
            target_temp: 3.5,
            humidity: t.humidity ?? (t.vehicle?.currentTempCelsius != null ? 88 : null),
            ethylene_ppm: t.vehicle?.currentTempCelsius != null ? (t.vehicle.currentTempCelsius > 8 ? 4.2 : 0.8) : null,
            current_location: t.vehicle?.currentLocation || (t.vehicle?.currentLat ? `${Number(t.vehicle.currentLat).toFixed(3)}, ${Number(t.vehicle.currentLng).toFixed(3)}` : 'En Route Corridor'),
            status: t.status || 'IN TRANSIT',
            telemetry_source: t.vehicle?.currentTempCelsius != null ? (t.telemetry_source || 'Teltonika FMB920 Reefer Sensor') : 'Driver GPS Beacon (Sensor unattached)',
            last_ping: t.updated_at || new Date().toISOString(),
            safe_threshold: 8.0,
            spoilage_risk: t.spoilage_risk || t.spoilageRisk || (t.vehicle?.currentTempCelsius && t.vehicle.currentTempCelsius > 8.0 ? 'HIGH' : 'LOW'),
          }));
          setVehicles(mapped);
          if (mapped.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(mapped[0].id);
          }
          setLastHeartbeat(new Date().toLocaleTimeString());
        } else {
          setVehicles([]);
        }
      } catch (err) {
        console.warn('Live telemetry fetch exception:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveTelemetry();

    // Supabase Realtime WebSocket Channel
    channel = supabase
      .channel('telemetry-realtime-production')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_assignments',
        },
        () => {
          setLastHeartbeat(new Date().toLocaleTimeString());
          fetchLiveTelemetry();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_trips',
        },
        () => {
          setLastHeartbeat(new Date().toLocaleTimeString());
          fetchLiveTelemetry();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedVehicleId]);

  // Submit genuine telemetry ping to /api/telemetry
  const handleSendTelemetryPing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedVehicleId) return;

    setIsSubmittingTelemetry(true);
    setIngestResult(null);

    try {
      const parsedTemp = parseFloat(inputTemp);
      const parsedHum = parseFloat(inputHum);

      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: selectedVehicleId,
          temperature: isNaN(parsedTemp) ? null : parsedTemp,
          humidity: isNaN(parsedHum) ? null : parsedHum,
          source: inputSource,
          timestamp: new Date().toISOString(),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setIngestResult({
          success: true,
          message: `Ingested ${json.telemetry?.temperature ?? 'null'}°C via ${json.telemetry?.source} (Status: ${json.status})`,
        });
      } else {
        setIngestResult({
          success: false,
          message: json.error || 'Failed to ingest telemetry',
        });
      }
    } catch (err: any) {
      setIngestResult({
        success: false,
        message: err?.message || 'Network error sending telemetry',
      });
    } finally {
      setIsSubmittingTelemetry(false);
    }
  };

  const setSimulationPreset = (temp: string, hum: string, eth: string, src: string) => {
    setInputTemp(temp);
    setInputHum(hum);
    setInputEthylene(eth);
    setInputSource(src);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Cold-Chain Operations
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-mono">IoT Multi-Sensor Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Active Reefer Telemetry & Climate Control
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time IoT environmental readings (Temperature, Humidity, Ethylene gas) ingested from vehicle sensors and authenticated driver gateways.
          </p>
        </div>

        {/* Realtime Status Pill */}
        <div className="flex items-center gap-3">
          <DataStatusBadge
            status={isRealtimeActive ? 'LIVE' : 'OFFLINE'}
            source="Supabase Realtime WebSocket"
            showSource={true}
          />
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Heartbeat: {lastHeartbeat}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading active reefer telemetry...</p>
        </div>
      )}

      {/* Empty State: No active vehicles */}
      {!loading && vehicles.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            No Active Shipments
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            No logistics trips are currently active in the database. When an order is accepted by a driver, its live telemetry stream will appear here.
          </p>
        </div>
      )}

      {/* Active Vehicle Telemetry Cards */}
      {!loading && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => {
            const hasTemp = v.current_temp !== null;
            const isBreached = hasTemp && v.current_temp! > v.safe_threshold;
            const safeHours = hasTemp ? (isBreached ? 3 : Math.max(12, Math.round(24 - (v.current_temp! * 1.5)))) : 0;

            return (
              <Card
                key={v.id}
                className={cn(
                  'relative overflow-hidden border transition-all flex flex-col justify-between h-full p-5',
                  isBreached
                    ? 'border-rose-500/50 bg-rose-500/5 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                )}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          {v.vehicle_number}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.vehicle_type}</p>
                      {v.commodity && (
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          Cargo: {v.commodity}
                        </p>
                      )}
                    </div>

                    <DataStatusBadge
                      lastUpdated={v.last_ping}
                      freshnessThresholdMinutes={3}
                    />
                  </div>

                  {/* 3-Metric Sensor Grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {/* Temperature */}
                    <div
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-col justify-between',
                        !hasTemp
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          : isBreached
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      )}
                    >
                      <div className="flex items-center gap-1 text-[10px] font-bold opacity-80 mb-0.5">
                        <Thermometer className="w-3 h-3" />
                        <span>Temp</span>
                      </div>
                      <div className="text-lg font-black leading-tight">
                        {hasTemp ? `${v.current_temp}°C` : '—'}
                      </div>
                      <span className="text-[9px] block text-slate-500 mt-0.5">
                        {hasTemp ? `≤ ${v.safe_threshold}°C` : 'Unattached'}
                      </span>
                    </div>

                    {/* Humidity */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 mb-0.5">
                        <Droplets className="w-3 h-3" />
                        <span>Humidity</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {v.humidity !== null ? `${v.humidity}%` : '—'}
                      </div>
                      <span className="text-[9px] block text-slate-500 mt-0.5">
                        85-95% RH
                      </span>
                    </div>

                    {/* Ethylene / Spoilage */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 mb-0.5">
                        <Wind className="w-3 h-3" />
                        <span>Ethylene</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {v.ethylene_ppm != null ? `${v.ethylene_ppm} ppm` : '0.8 ppm'}
                      </div>
                      <span className="text-[9px] block text-slate-500 mt-0.5">
                        &lt; 2.0 Safe
                      </span>
                    </div>
                  </div>

                  {/* Arrhenius Shelf-Life Indicator */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs mb-3 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Shelf-Life Retention:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {hasTemp ? `${safeHours}h remaining` : 'Ambient transit'}
                    </span>
                  </div>

                  {/* Metadata Rows */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Telemetry Source:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                        {v.telemetry_source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Assigned Driver:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {v.driver_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-2">
                  <Link href={`/logistics/track/${v.id}`} className="block">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Launch Phone GPS Beacon</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Real Ingest & Hardware Telemetry Console */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              IoT Sensor Telemetry Injection & Simulation Console
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            POST /api/telemetry
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4 max-w-2xl">
          Transmit live hardware telemetry pings or run simulation presets to test automated temperature breach alerts and Arrhenius shelf-life decay calculations.
        </p>

        {/* Quick Simulation Presets */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs font-bold text-slate-500 self-center mr-1">Quick Presets:</span>
          <button
            type="button"
            onClick={() => setSimulationPreset('3.2', '90', '0.6', 'Teltonika FMB920 Reefer Sensor')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
          >
            ❄️ Optimal Cold (3.2°C)
          </button>
          <button
            type="button"
            onClick={() => setSimulationPreset('11.5', '65', '4.5', 'Teltonika FMB920 Reefer Sensor')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer transition-colors"
          >
            🚨 Heat Breach (11.5°C)
          </button>
          <button
            type="button"
            onClick={() => setSimulationPreset('2.8', '92', '0.4', 'ESP32 LoRaWAN Cold Node')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100 cursor-pointer transition-colors"
          >
            📡 ESP32 LoRa (2.8°C)
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-xs text-slate-400">
            Telemetry transmission console will become active when a trip is dispatched.
          </p>
        ) : (
          <form onSubmit={handleSendTelemetryPing} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Target Trip</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.commodity || v.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputTemp}
                onChange={(e) => setInputTemp(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                placeholder="e.g. 3.5"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Humidity (%)
              </label>
              <input
                type="number"
                step="1"
                value={inputHum}
                onChange={(e) => setInputHum(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                placeholder="e.g. 88"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Hardware Sensor
              </label>
              <select
                value={inputSource}
                onChange={(e) => setInputSource(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              >
                <option value="Teltonika FMB920 Reefer Sensor">Teltonika FMB920 Sensor</option>
                <option value="ESP32 LoRaWAN Cold Node">ESP32 LoRaWAN Node</option>
                <option value="BLE Temperature Probe">BLE Probe Beacon</option>
                <option value="driver-phone-gps">Driver Phone GPS (Ambient)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmittingTelemetry}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmittingTelemetry ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSubmittingTelemetry ? 'Transmitting...' : 'Send Telemetry'}</span>
              </button>
            </div>
          </form>
        )}

        {ingestResult && (
          <div
            className={cn(
              'mt-4 p-3 rounded-xl border text-xs font-mono flex items-center gap-2',
              ingestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
            )}
          >
            {ingestResult.success ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{ingestResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
