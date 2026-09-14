'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
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
  current_location?: string;
  status: string;
  telemetry_source?: string;
  last_ping?: string | null;
  safe_threshold: number;
}

export default function ColdChainTelemetryPage() {
  const [vehicles, setVehicles] = useState<TelemetryVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString());

  // Real Telemetry Ingestion Test State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [inputTemp, setInputTemp] = useState<string>('6.5');
  const [inputHum, setInputHum] = useState<string>('75');
  const [inputSource, setInputSource] = useState<string>('Teltonika FMB920 Reefer Sensor');
  const [isSubmittingTelemetry, setIsSubmittingTelemetry] = useState(false);
  const [ingestResult, setIngestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Fetch initial telemetry and subscribe to Supabase Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchLiveTelemetry = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('logistics_trips')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Supabase telemetry query notice:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const mapped: TelemetryVehicle[] = data.map((row: any) => ({
            id: row.id,
            vehicle_number: row.vehicle_number || 'TS 08 UB 4192',
            vehicle_type: row.vehicle_type || 'Tata 407 Reefer',
            driver_name: row.driver_name || 'Fleet Operator',
            commodity: row.commodity || 'Farm Produce',
            current_temp: row.current_temp != null ? Number(row.current_temp) : null,
            target_temp: Number(row.target_temp) || 6.0,
            humidity: row.humidity != null ? Number(row.humidity) : null,
            current_location: row.current_location || (row.current_lat ? `${Number(row.current_lat).toFixed(3)}, ${Number(row.current_lng).toFixed(3)}` : 'En Route'),
            status: row.status || 'IN TRANSIT',
            telemetry_source: row.telemetry_source || 'Awaiting Device Ping',
            last_ping: row.last_telemetry_at || row.updated_at || null,
            safe_threshold: Number(row.safe_temp_threshold) || 8.0,
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
          table: 'logistics_trips',
        },
        (payload) => {
          setLastHeartbeat(new Date().toLocaleTimeString());
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedRow: any = payload.new;
            setVehicles((prev) => {
              const exists = prev.some((v) => v.id === updatedRow.id);
              if (exists) {
                return prev.map((v) =>
                  v.id === updatedRow.id
                    ? {
                        ...v,
                        current_temp: updatedRow.current_temp != null ? Number(updatedRow.current_temp) : null,
                        humidity: updatedRow.humidity != null ? Number(updatedRow.humidity) : null,
                        current_location: updatedRow.current_location || v.current_location,
                        status: updatedRow.status || v.status,
                        telemetry_source: updatedRow.telemetry_source || v.telemetry_source,
                        last_ping: updatedRow.last_telemetry_at || updatedRow.updated_at || new Date().toISOString(),
                      }
                    : v
                );
              }
              return [
                {
                  id: updatedRow.id,
                  vehicle_number: updatedRow.vehicle_number || 'TS 08 UB 4192',
                  vehicle_type: updatedRow.vehicle_type || 'Tata 407 Reefer',
                  driver_name: updatedRow.driver_name,
                  commodity: updatedRow.commodity,
                  current_temp: updatedRow.current_temp != null ? Number(updatedRow.current_temp) : null,
                  target_temp: Number(updatedRow.target_temp) || 6.0,
                  humidity: updatedRow.humidity != null ? Number(updatedRow.humidity) : null,
                  status: updatedRow.status || 'IN TRANSIT',
                  telemetry_source: updatedRow.telemetry_source || 'Verified Device',
                  last_ping: updatedRow.last_telemetry_at || updatedRow.updated_at || new Date().toISOString(),
                  safe_threshold: Number(updatedRow.safe_temp_threshold) || 8.0,
                },
                ...prev,
              ];
            });
          }
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
  const handleSendTelemetryPing = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Cold-Chain Operations
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-mono">Live Telemetry Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Active Reefer Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time IoT environmental readings ingested from vehicle sensors and authenticated driver gateways.
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading active reefer telemetry...</p>
        </div>
      )}

      {/* Honest Empty State: No active vehicles */}
      {!loading && vehicles.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicles.map((v) => {
            const hasTemp = v.current_temp !== null;
            const isBreached = hasTemp && v.current_temp! > v.safe_threshold;

            return (
              <Card
                key={v.id}
                className={cn(
                  'relative overflow-hidden border transition-all',
                  isBreached
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                )}
              >
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

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Temperature */}
                  <div
                    className={cn(
                      'p-3 rounded-xl border',
                      !hasTemp
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        : isBreached
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-80 mb-1">
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Temperature</span>
                    </div>
                    <div className="text-xl font-black">
                      {hasTemp ? (
                        <>
                          {v.current_temp}°C
                          <span className="text-[10px] font-normal block text-slate-500 mt-0.5">
                            Target: {v.target_temp}°C (Safe &le; {v.safe_threshold}°C)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">No live reading</span>
                      )}
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      <span>Humidity</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {v.humidity !== null ? (
                        <>
                          {v.humidity}%
                          <span className="text-[10px] font-normal block text-slate-500 mt-0.5">
                            Relative RH
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">No live reading</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Telemetry Source:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {v.telemetry_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Driver:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {v.driver_name}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/logistics/track/${v.id}`} className="block">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20">
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

      {/* Real Ingest & Device Verification Console */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Telemetry Ingestion & Integration Console
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-5 max-w-2xl">
          Transmit genuine hardware sensor readings to <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">POST /api/telemetry</code>. Used by IoT gateways and driver telematics units.
        </p>

        {vehicles.length === 0 ? (
          <p className="text-xs text-slate-400">
            Telemetry transmission console will become active when a trip is dispatched.
          </p>
        ) : (
          <form onSubmit={handleSendTelemetryPing} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                placeholder="e.g. 6.5"
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
                placeholder="e.g. 78"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmittingTelemetry}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmittingTelemetry ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSubmittingTelemetry ? 'Transmitting...' : 'Send Telemetry Ping'}</span>
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
