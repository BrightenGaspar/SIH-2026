'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { logisticsService } from '@/services/logisticsService';
import PhoneGpsBeacon from '@/components/logistics/PhoneGpsBeacon';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

// Dynamic import for Leaflet map
const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Loading GPS Map...
    </div>
  ),
});

export default function LogisticsTrackTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = (params?.tripId as string) || '';

  const [trip, setTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!tripId) return;

    async function loadTrip() {
      try {
        setLoading(true);
        const tripData = await logisticsService.getTripById(tripId);
        if (tripData) {
          setTrip(tripData);
          const lat = tripData.vehicle?.currentLat;
          const lng = tripData.vehicle?.currentLng;
          if (lat != null && lng != null) {
            setCurrentCoords({ lat: Number(lat), lng: Number(lng) });
          }
        } else {
          // Direct table fallback
          const { data } = await supabase
            .from('logistics_trips')
            .select('*')
            .eq('id', tripId)
            .maybeSingle();

          if (data) {
            setTrip(data);
            if (data.current_lat && data.current_lng) {
              setCurrentCoords({ lat: Number(data.current_lat), lng: Number(data.current_lng) });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load trip for phone tracking:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTrip();

    // Subscribe to Realtime updates for this trip on both tables
    const channel = supabase
      .channel(`track:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_assignments',
          filter: `id=eq.${tripId}`,
        },
        async () => {
          const fresh = await logisticsService.getTripById(tripId);
          if (fresh) {
            setTrip(fresh);
            if (fresh.vehicle?.currentLat && fresh.vehicle?.currentLng) {
              setCurrentCoords({ lat: fresh.vehicle.currentLat, lng: fresh.vehicle.currentLng });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_trips',
          filter: `id=eq.${tripId}`,
        },
        async () => {
          const fresh = await logisticsService.getTripById(tripId);
          if (fresh) {
            setTrip(fresh);
            if (fresh.vehicle?.currentLat && fresh.vehicle?.currentLng) {
              setCurrentCoords({ lat: fresh.vehicle.currentLat, lng: fresh.vehicle.currentLng });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const handlePositionUpdate = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
  };

  const tripCode = trip?.tripCode || trip?.trip_code || (tripId ? `TRIP-${tripId.slice(-6)}` : 'TRIP-ACTIVE');
  const vehicleNumber = trip?.vehicle?.vehicleNumber || trip?.vehicle_number || 'TS 08 UB 4192';
  const vehicleType = trip?.vehicle?.vehicleType || trip?.vehicle_type || 'Tata 407 Reefer';
  const driverName = trip?.vehicle?.driverName || trip?.driver_name || 'Active Operator';
  const driverPhone = trip?.vehicle?.driverPhone || trip?.driver_phone || '+91 98480 22341';
  const commodity = trip?.commodity || 'Perishable Produce';
  const totalKg = trip?.totalKg || trip?.total_kg || 0;
  const sourceHub = trip?.sourceHub || trip?.source_hub || 'Origin Farm Hub';
  const destinationHub = trip?.destinationHub || trip?.destination_hub || 'Destination APMC Terminal';
  const status = trip?.status || 'IN TRANSIT';
  const totalDistanceKm = Number(trip?.totalDistanceKm || trip?.total_distance_km) || 80;
  const distanceCompletedKm = Number(trip?.distanceCompletedKm || trip?.distance_completed_km) || 0;
  const distanceRemainingKm = Math.max(0, totalDistanceKm - distanceCompletedKm);
  const currentTemp = trip?.coldChainTemp ?? trip?.current_temp ?? null;
  const humidity = trip?.humidity ?? null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/logistics/trips" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assigned Trips
        </Link>
        <Link 
          href={`/consumer/tracking/${tripId}`} 
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
        >
          <span>View Public Buyer Tracking</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[11px] font-black tracking-wider uppercase">
              {status}
            </span>
            <span className="text-xs font-mono text-slate-400">
              #{tripCode}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Phone GPS Beacon Transmitter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transmit genuine live GPS coordinates from this phone directly to the AgriFlow logistics network.
          </p>
        </div>

        <div>
          <DataStatusBadge
            lastUpdated={trip?.last_telemetry_at || trip?.updated_at}
            freshnessThresholdMinutes={1}
            source={trip?.telemetry_source || 'driver-phone-gps'}
            showSource={true}
          />
        </div>
      </div>

      {/* Main Driver Phone GPS Beacon Control Component */}
      <PhoneGpsBeacon
        tripId={tripId}
        tripCode={tripCode}
        carrierVehicle={`${vehicleNumber} (${vehicleType})`}
        commodity={`${commodity} • ${totalKg} kg`}
        sourceHub={sourceHub}
        destinationHub={destinationHub}
        onPositionUpdate={handlePositionUpdate}
      />

      {/* Live Map Preview */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-500" /> Real GPS Location Broadcast
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentCoords ? `${currentCoords.lat.toFixed(4)}°, ${currentCoords.lng.toFixed(4)}°` : 'Awaiting fix'}
          </span>
        </div>

        <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <LiveTrackingMap
            trip={{
              id: tripId,
              orderId: trip?.order_id || tripId,
              tripId: tripId,
              vehicleNumber: vehicleNumber,
              vehicleType: vehicleType as any,
              driverName: driverName,
              driverPhone: driverPhone,
              status: status as any,
              currentCoordinates: currentCoords ? [currentCoords.lat, currentCoords.lng] : undefined,
              pickupCoordinates: [17.3850, 78.4867],
              destinationCoordinates: [17.4400, 78.3800],
              currentLocationName: trip?.current_location || 'Live Driver Phone Beacon',
              pickupLocation: sourceHub,
              destinationLocation: destinationHub,
              produceName: commodity,
              totalQuantityKg: totalKg,
              estimatedArrival: trip?.estimatedArrival || 'En Route',
              distanceRemainingKm: distanceRemainingKm,
              distanceCompletedKm: distanceCompletedKm,
              totalDistanceKm: totalDistanceKm,
              progressPercentage: totalDistanceKm > 0 ? Math.round((distanceCompletedKm / totalDistanceKm) * 100) : 50,
              etaMinutes: 45,
              telemetry: {
                temperatureCelsius: currentTemp != null ? Number(currentTemp) : (null as any),
                targetTempCelsius: Number(trip?.target_temp) || 5.0,
                humidityPercent: humidity != null ? Number(humidity) : (null as any),
                safeWindowHours: 4,
                safeWindowMinutes: 0,
                spoilageRisk: 'LOW',
                reeferActive: Boolean(trip?.reefer_active),
                explanation: 'Phone GPS beacon active. Cargo temperature sensor not connected.',
              },
              waypoints: [],
              routeCoordinates: currentCoords ? [[currentCoords.lat, currentCoords.lng]] : [],
            }}
            showTelemetryPopup={false}
          />
        </div>
      </Card>

      {/* Operator Safety & System Guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Driver Identity Verification</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Telemetry is authenticated to your logistics profile. Only your phone can broadcast GPS updates for this assigned haul.
          </p>
        </Card>

        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Battery & Data Conservation</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Toggle <strong>Low-Data (15s)</strong> mode during long highway legs to save battery and conserve cellular data bandwidth.
          </p>
        </Card>
      </div>

    </div>
  );
}


