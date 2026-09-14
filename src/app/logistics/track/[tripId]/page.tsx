'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
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
        const { data, error } = await supabase
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
      } catch (err) {
        console.error('Failed to load trip for phone tracking:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTrip();

    // Subscribe to Realtime updates for this trip
    const channel = supabase
      .channel(`public:logistics_trips:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'logistics_trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          if (payload.new) {
            setTrip(payload.new);
            if (payload.new.current_lat && payload.new.current_lng) {
              setCurrentCoords({
                lat: Number(payload.new.current_lat),
                lng: Number(payload.new.current_lng),
              });
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
              {trip?.status || 'IN TRANSIT'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              #{trip?.trip_code || tripId}
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
            lastUpdated={trip?.last_telemetry_at}
            freshnessThresholdMinutes={1}
            source={trip?.telemetry_source || 'driver-phone-gps'}
            showSource={true}
          />
        </div>
      </div>

      {/* Main Driver Phone GPS Beacon Control Component */}
      <PhoneGpsBeacon
        tripId={tripId}
        tripCode={trip?.trip_code || `TRIP-${tripId.slice(-6)}`}
        carrierVehicle={trip?.vehicle_number ? `${trip.vehicle_number} (${trip.vehicle_type || 'Reefer'})` : undefined}
        commodity={trip?.commodity ? `${trip.commodity} � ${trip.total_kg || 0} kg` : undefined}
        sourceHub={trip?.source_hub}
        destinationHub={trip?.destination_hub}
        onPositionUpdate={handlePositionUpdate}
      />

      {/* Live Map Preview */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-500" /> Real GPS Location Broadcast
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentCoords ? `${currentCoords.lat.toFixed(4)}�, ${currentCoords.lng.toFixed(4)}�` : 'Awaiting fix'}
          </span>
        </div>

        <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <LiveTrackingMap
            trip={{
              id: tripId,
              orderId: trip?.order_id || tripId,
              tripId: tripId,
              vehicleNumber: trip?.vehicle_number || 'TS 08 UB 4192',
              vehicleType: (trip?.vehicle_type || 'Tata 407 Reefer') as any,
              driverName: trip?.driver_name || 'Active Operator',
              driverPhone: trip?.driver_phone || '+91 98480 22341',
              status: trip?.status || 'IN TRANSIT',
              currentCoordinates: currentCoords ? [currentCoords.lat, currentCoords.lng] : undefined,
              pickupCoordinates: [17.3850, 78.4867],
              destinationCoordinates: [17.4400, 78.3800],
              currentLocationName: trip?.current_location || 'Live Driver Phone Beacon',
              pickupLocation: trip?.source_hub || 'Origin Farm',
              destinationLocation: trip?.destination_hub || 'Destination Yard',
              produceName: trip?.commodity || 'Perishable Produce',
              totalQuantityKg: trip?.total_kg || 1000,
              estimatedArrival: 'En Route',
              distanceRemainingKm: Math.max(0, (Number(trip?.total_distance_km) || 80) - (Number(trip?.distance_completed_km) || 0)),
              distanceCompletedKm: Number(trip?.distance_completed_km) || 0,
              totalDistanceKm: Number(trip?.total_distance_km) || 80,
              progressPercentage: 45,
              etaMinutes: 45,
              telemetry: {
                temperatureCelsius: trip?.current_temp != null ? Number(trip.current_temp) : (null as any),
                targetTempCelsius: Number(trip?.target_temp) || 5.0,
                humidityPercent: trip?.humidity != null ? Number(trip.humidity) : (null as any),
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


