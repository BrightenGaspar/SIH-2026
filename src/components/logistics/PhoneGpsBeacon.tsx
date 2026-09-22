'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Navigation, 
  Wifi, 
  WifiOff, 
  Radio, 
  Square, 
  Play, 
  MapPin, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Compass, 
  BatteryMedium,
  CheckCircle2,
  Copy,
  Info
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';

export interface PhoneGpsBeaconProps {
  tripId: string;
  tripCode?: string;
  carrierVehicle?: string;
  commodity?: string;
  sourceHub?: string;
  destinationHub?: string;
  onPositionUpdate?: (lat: number, lng: number, accuracy: number) => void;
  className?: string;
}

export type GpsTrackingStatus = 
  | 'IDLE' 
  | 'ACQUIRING' 
  | 'LIVE' 
  | 'PERMISSION_DENIED' 
  | 'UNAVAILABLE' 
  | 'PAUSED' 
  | 'ERROR';

export default function PhoneGpsBeacon({
  tripId,
  tripCode,
  carrierVehicle,
  commodity,
  sourceHub,
  destinationHub,
  onPositionUpdate,
  className,
}: PhoneGpsBeaconProps) {
  const { t } = useI18n();
  const [isTracking, setIsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsTrackingStatus>('IDLE');
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
  } | null>(null);

  const [transmissionCount, setTransmissionCount] = useState(0);
  const [lastTransmissionTime, setLastTransmissionTime] = useState<string | null>(null);
  const [lastTransmissionSuccess, setLastTransmissionSuccess] = useState<boolean | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastSendTimeRef = useRef<number>(0);
  const pendingPositionRef = useRef<GeolocationPosition | null>(null);

  // Send GPS payload to /api/telemetry
  const transmitGpsUpdate = useCallback(async (pos: GeolocationPosition) => {
    try {
      const now = Date.now();
      const sendInterval = isLowBandwidth ? 15000 : 4000;

      // Throttle sends to prevent flooding
      if (now - lastSendTimeRef.current < sendInterval) {
        return;
      }
      lastSendTimeRef.current = now;

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy * 10) / 10;
      const speedKmh = pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6 * 10) / 10 : null;
      const heading = pos.coords.heading != null ? Math.round(pos.coords.heading) : null;

      const payload = {
        trip_id: tripId,
        latitude: lat,
        longitude: lng,
        accuracy_meters: accuracy,
        speed_kmh: speedKmh,
        heading: heading,
        source: 'driver-phone-gps',
        timestamp: new Date(pos.timestamp).toISOString(),
      };

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastTransmissionSuccess(true);
        setTransmissionCount((c) => c + 1);
        setLastTransmissionTime(new Date().toLocaleTimeString());
        setErrorMessage(null);
        if (onPositionUpdate) {
          onPositionUpdate(lat, lng, accuracy);
        }
      } else {
        setLastTransmissionSuccess(false);
        setErrorMessage(data.error || 'Server error ingesting phone telemetry');
      }
    } catch (err: any) {
      setLastTransmissionSuccess(false);
      setErrorMessage(err?.message || 'Network error transmitting GPS fix');
    }
  }, [tripId, isLowBandwidth, onPositionUpdate]);

  // Request Screen Wake Lock (keeps phone awake on dashboard mount)
  const requestWakeLock = async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.warn('Wake Lock request notice:', err);
        setWakeLockActive(false);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  // Start Live Tracking
  const startTracking = () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('UNAVAILABLE');
      setErrorMessage('Geolocation API is not supported by your mobile browser.');
      return;
    }

    setGpsStatus('ACQUIRING');
    setIsTracking(true);
    requestWakeLock();

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGpsStatus('LIVE');
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed != null ? position.coords.speed * 3.6 : null,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });

        pendingPositionRef.current = position;
        transmitGpsUpdate(position);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('PERMISSION_DENIED');
          setErrorMessage('Location permission was denied. Please allow device location access to enable live shipment tracking.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsStatus('UNAVAILABLE');
          setErrorMessage('GPS position unavailable. Check device GPS and clear line-of-sight to the sky.');
        } else if (error.code === error.TIMEOUT) {
          setGpsStatus('PAUSED');
          setErrorMessage('GPS signal acquisition timed out. Retrying...');
        } else {
          setGpsStatus('ERROR');
          setErrorMessage(error.message || 'Error acquiring device GPS.');
        }
      },
      options
    );
  };

  // Stop Live Tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    setIsTracking(false);
    setGpsStatus('IDLE');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, []);

  const handleCopy = async () => {
    if (!coords) return;
    const text = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy not permitted:', e);
    }
  };

  return (
    <Card className={cn('p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md space-y-5', className)}>
      
      {/* Header & Mode Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-9 h-9 rounded-2xl flex items-center justify-center transition-all',
            isTracking 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          )}>
            <Radio className={cn('w-5 h-5', isTracking && 'animate-pulse')} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Driver Phone GPS Beacon
            </h2>
            <p className="text-[11px] text-slate-500">
              Trip: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{tripCode || tripId}</span>
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-[11px] font-black tracking-wider flex items-center gap-1.5 border',
            gpsStatus === 'LIVE' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 animate-pulse',
            gpsStatus === 'ACQUIRING' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
            gpsStatus === 'IDLE' && 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
            (gpsStatus === 'PERMISSION_DENIED' || gpsStatus === 'ERROR') && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
          )}>
            <span className={cn(
              'w-2 h-2 rounded-full',
              gpsStatus === 'LIVE' && 'bg-emerald-500 animate-ping',
              gpsStatus === 'ACQUIRING' && 'bg-amber-500',
              gpsStatus === 'IDLE' && 'bg-slate-400',
              (gpsStatus === 'PERMISSION_DENIED' || gpsStatus === 'ERROR') && 'bg-rose-500'
            )} />
            {gpsStatus === 'LIVE' && 'LIVE TRACKING'}
            {gpsStatus === 'ACQUIRING' && 'ACQUIRING GPS FIX'}
            {gpsStatus === 'IDLE' && 'BEACON READY'}
            {gpsStatus === 'PERMISSION_DENIED' && 'PERMISSION DENIED'}
            {gpsStatus === 'ERROR' && 'GPS ERROR'}
            {gpsStatus === 'UNAVAILABLE' && 'NO GPS SIGNAL'}
            {gpsStatus === 'PAUSED' && 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Shipment Route Summary */}
      {(sourceHub || destinationHub || commodity) && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Haul</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{sourceHub || 'Origin Hub'} &rarr; {destinationHub || 'Destination Yard'}</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Cargo</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{commodity || 'Farm Harvest'} {carrierVehicle ? `� ${carrierVehicle}` : ''}</span>
          </div>
        </div>
      )}

      {/* Main Beacon Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Coordinates */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Phone GPS Position
            </span>
            {coords && (
              <button 
                type="button" 
                onClick={handleCopy}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {copiedCoords ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedCoords ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
            {coords ? (
              `${coords.latitude.toFixed(5)}�, ${coords.longitude.toFixed(5)}�`
            ) : (
              <span className="text-slate-400 font-normal text-xs">Awaiting phone GPS fix...</span>
            )}
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-400 block">GPS Accuracy</span>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-base">
            {coords ? `�${Math.round(coords.accuracy)} m` : '�'}
          </div>
          <span className="text-[10px] text-slate-400">
            {coords && coords.accuracy <= 10 ? 'High Precision' : coords ? 'Acceptable Fix' : 'No fix'}
          </span>
        </div>

        {/* Speed */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-500" /> Velocity
          </span>
          <div className="mt-1 font-mono font-bold text-slate-900 dark:text-white text-base">
            {coords && coords.speed != null ? `${Math.round(coords.speed)} km/h` : '0 km/h'}
          </div>
          <span className="text-[10px] text-slate-400">Road Speed</span>
        </div>
      </div>

      {/* Temperature Separation Banner */}
      <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Cargo Temperature Separation:</strong>
          <span>
            This phone operates as the live GPS beacon. Reefer cargo temperature is marked as <strong>&ldquo;No live reading&rdquo;</strong> to preserve data integrity until a certified digital probe is paired.
          </span>
        </div>
      </div>

      {/* Primary Action Button (Start / Stop Live Tracking) */}
      <div className="pt-1">
        {!isTracking ? (
          <Button
            type="button"
            onClick={startTracking}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Live Tracking</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopTracking}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Live Tracking</span>
          </Button>
        )}
      </div>

      {/* System Status Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Last sent: <strong className="text-slate-700 dark:text-slate-300 font-mono">{lastTransmissionTime || 'Never'}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700">&bull;</span>
          <span>
            Pings: <strong className="text-slate-700 dark:text-slate-300 font-mono">{transmissionCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {wakeLockActive && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
              Screen Awake
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsLowBandwidth(!isLowBandwidth)}
            className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-bold border transition',
              isLowBandwidth 
                ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
            )}
          >
            {isLowBandwidth ? 'Low-Data (15s)' : 'Standard (4s)'}
          </button>
        </div>
      </div>

      {/* Transparent Limitation Notice */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
        <strong>Notice:</strong> Keep this browser tab open while driving. Mobile operating systems may throttle or suspend background GPS when the screen is locked or browser is minimized.
      </div>

      {/* Error / Alert Callout */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

    </Card>
  );
}
