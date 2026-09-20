'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Camera,
  CheckCircle2,
  Loader2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
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

  // Delivery Proof State
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [deliverySuccess, setDeliverySuccess] = useState<boolean>(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null);

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

  // Load existing proof photo if available
  useEffect(() => {
    async function loadProofUrl() {
      const path = trip?.proof_photo_path || trip?.proofPhotoPath;
      if (path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
          setExistingProofUrl(path);
        } else {
          const signed = await logisticsService.getDeliveryProofSignedUrl(path);
          if (signed) setExistingProofUrl(signed);
        }
      }
    }
    loadProofUrl();
  }, [trip]);

  const handlePositionUpdate = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedPhoto(file);
    setDeliveryError(null);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleClearPhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmitDelivery = async () => {
    if (!selectedPhoto) {
      setDeliveryError('Delivery proof photo is mandatory before marking delivered.');
      return;
    }

    setUploadingProof(true);
    setDeliveryError(null);

    try {
      // 1. Upload camera delivery proof photo to private delivery-proofs storage bucket
      const proofPath = await logisticsService.uploadDeliveryProof(tripId, selectedPhoto);

      // 2. Transition status to 'delivered' via authoritative database RPC
      const res = await logisticsService.updateDeliveryStatus(tripId, 'delivered', proofPath);

      if (res.success) {
        setDeliverySuccess(true);
        setTrip((prev: any) => ({
          ...prev,
          status: 'DELIVERED',
          proof_photo_path: proofPath,
        }));

        // Fetch signed url for instant verified preview
        const signed = await logisticsService.getDeliveryProofSignedUrl(proofPath);
        if (signed) setExistingProofUrl(signed);
      } else {
        setDeliveryError(res.error || 'Failed to update delivery status. Please retry.');
      }
    } catch (err: any) {
      console.error('Error submitting delivery proof:', err);
      setDeliveryError(err?.message || 'Error uploading delivery proof photo.');
    } finally {
      setUploadingProof(false);
    }
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
  const rawStatus = String(trip?.status || 'IN TRANSIT');
  const status = rawStatus.toUpperCase();
  const totalDistanceKm = Number(trip?.totalDistanceKm || trip?.total_distance_km) || 80;
  const distanceCompletedKm = Number(trip?.distanceCompletedKm || trip?.distance_completed_km) || 0;
  const distanceRemainingKm = Math.max(0, totalDistanceKm - distanceCompletedKm);
  const currentTemp = trip?.coldChainTemp ?? trip?.current_temp ?? null;
  const humidity = trip?.humidity ?? null;

  const isDelivered = deliverySuccess || status === 'DELIVERED' || status === 'COMPLETED';

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
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${
              isDelivered
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
            }`}>
              {isDelivered ? 'DELIVERED' : status}
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
              status: (isDelivered ? 'DELIVERED' : status) as any,
              currentCoordinates: currentCoords ? [currentCoords.lat, currentCoords.lng] : undefined,
              pickupCoordinates: [17.3850, 78.4867],
              destinationCoordinates: [17.4400, 78.3800],
              currentLocationName: trip?.current_location || 'Live Driver Phone Beacon',
              pickupLocation: sourceHub,
              destinationLocation: destinationHub,
              produceName: commodity,
              totalQuantityKg: totalKg,
              estimatedArrival: isDelivered ? 'Delivered' : (trip?.estimatedArrival || 'En Route'),
              distanceRemainingKm: isDelivered ? 0 : distanceRemainingKm,
              distanceCompletedKm: isDelivered ? totalDistanceKm : distanceCompletedKm,
              totalDistanceKm: totalDistanceKm,
              progressPercentage: isDelivered ? 100 : (totalDistanceKm > 0 ? Math.round((distanceCompletedKm / totalDistanceKm) * 100) : 50),
              etaMinutes: isDelivered ? 0 : 45,
              telemetry: {
                temperatureCelsius: currentTemp != null ? Number(currentTemp) : (null as any),
                targetTempCelsius: Number(trip?.target_temp) || 5.0,
                humidityPercent: humidity != null ? Number(humidity) : (null as any),
                safeWindowHours: 4,
                safeWindowMinutes: 0,
                spoilageRisk: 'LOW',
                reeferActive: Boolean(trip?.reefer_active),
                explanation: 'Phone GPS beacon active. Cargo temperature sensor monitored.',
              },
              waypoints: [],
              routeCoordinates: currentCoords ? [[currentCoords.lat, currentCoords.lng]] : [],
            }}
            showTelemetryPopup={false}
          />
        </div>
      </Card>

      {/* Mandatory Delivery Proof & Completion Section */}
      {isDelivered ? (
        <Card className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Delivery Recorded & Verified
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PROOF SAVED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Delivery completed with mandatory photographic proof. The destination recipient has been notified in real time to inspect and confirm receipt, releasing escrow funds to your fleet account.
          </p>

          {(existingProofUrl || photoPreview) && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-emerald-400" /> Uploaded Proof Photo
              </span>
              <div className="rounded-2xl overflow-hidden border border-emerald-500/30 max-h-64 aspect-video bg-black/80 flex items-center justify-center">
                <img
                  src={existingProofUrl || photoPreview!}
                  alt="Delivery Proof Confirmation"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-500" /> Mandatory Proof of Delivery (POD)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Photograph offloaded produce at destination before marking delivered.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Required by Escrow
            </span>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {deliveryError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deliveryError}</span>
            </div>
          )}

          {photoPreview ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 max-h-72 aspect-video bg-slate-950 flex items-center justify-center">
                <img
                  src={photoPreview}
                  alt="Selected Delivery Proof"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-white font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Photo Ready
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  disabled={uploadingProof}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleSubmitDelivery}
                  disabled={uploadingProof}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition"
                >
                  {uploadingProof ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading Proof & Marking Delivered...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Upload Proof & Mark as Delivered
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Capture Delivery Proof Photo
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Smart contracts require a genuine photo of the delivered produce crates/bags at the recipient unloading dock to initiate escrow settlement.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <ImageIcon className="w-4 h-4" /> Upload from Device
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Operator Safety & System Guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Driver Identity Verification</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Telemetry and delivery proofs are authenticated to your logistics profile. Photos are cryptographically linked to your assignment.
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
