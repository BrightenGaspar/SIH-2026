'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { DeliveryTracking } from '@/types/delivery';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import { supabase } from '@/lib/supabase';

interface TrackingContextType {
  getTrip: (id: string) => DeliveryTracking | null;
  activeTrip: DeliveryTracking | null;
  setActiveTripId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshTrip: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

const DEFAULT_TRIP_ID = 'TRK-CONS-ROAD-9021';

function mapLogisticsRowToDeliveryTracking(row: any, fallbackId: string): DeliveryTracking {
  const currentLat = Number(row.current_lat) || 17.2403;
  const currentLng = Number(row.current_lng) || 78.4294;
  const currentTemp = Number(row.current_temp) || 6.2;
  const humidity = Number(row.humidity) || 88;
  const pickupLat = Number(row.pickup_lat) || 17.0684;
  const pickupLng = Number(row.pickup_lng) || 78.2078;
  const destLat = Number(row.dest_lat) || 17.4729;
  const destLng = Number(row.dest_lng) || 78.4842;
  const pickupLocation = row.pickup_location || row.source_hub || 'Shadnagar FPO Cluster Hub';
  const destinationLocation = row.destination_location || row.destination_hub || 'Bowenpally Agri Terminal, Hyderabad';
  const currentLocation = row.current_location || 'Shamshabad Outer Ring Road Tollway (NH 44)';

  return {
    id: row.id || fallbackId,
    tripId: row.trip_code || row.id || fallbackId,
    orderId: row.order_id || `ORD-${row.id || fallbackId}`,
    produceName: row.commodity || 'Fresh Farm Produce Lot',
    totalQuantityKg: Number(row.total_kg) || 2400,
    status: (row.status || 'IN TRANSIT') as any,
    vehicleType: (row.vehicle_type || 'Tata 407 Reefer') as any,
    vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
    driverName: row.driver_name || 'Driver',
    driverPhone: row.driver_phone || '+91 98480 22341',
    pickupLocation,
    destinationLocation,
    currentLocationName: currentLocation,
    currentCoordinates: [currentLat, currentLng],
    pickupCoordinates: [pickupLat, pickupLng],
    destinationCoordinates: [destLat, destLng],
    estimatedArrival: row.estimated_arrival || 'Today, 05:45 PM',
    distanceRemainingKm: Number(row.distance_remaining_km) || 28,
    distanceCompletedKm: Number(row.distance_completed_km) || 46,
    totalDistanceKm: Number(row.total_distance_km) || 74,
    progressPercentage: Number(row.progress_percent) || 68,
    etaMinutes: Number(row.eta_minutes) || 45,
    telemetry: {
      temperatureCelsius: currentTemp,
      targetTempCelsius: Number(row.target_temp) || 6.0,
      humidityPercent: humidity,
      safeWindowHours: Number(row.safe_window_hours) || 4,
      safeWindowMinutes: Number(row.safe_window_minutes) || 30,
      spoilageRisk: (row.spoilage_risk || 'LOW') as any,
      reeferActive: row.reefer_active ?? true,
      explanation: 'Reefer cooling active within optimal safe preservation limits.',
    },
    waypoints: [
      { id: 'wp-1', title: 'Harvest Loaded & Crating Verified', location: pickupLocation, coordinates: [pickupLat, pickupLng], timestamp: '08:30 AM', completed: true },
      { id: 'wp-2', title: 'Reefer Sealed & Cold Lock Active', location: 'Dispatch Yard Gate', coordinates: [pickupLat, pickupLng], timestamp: '09:15 AM', completed: true },
      { id: 'wp-3', title: 'Carrier in Transit (Live Telemetry)', location: currentLocation, coordinates: [currentLat, currentLng], timestamp: 'Live Point', completed: true, current: true },
      { id: 'wp-4', title: 'Destination Agri Terminal', location: destinationLocation, coordinates: [destLat, destLng], timestamp: '05:45 PM (ETA)', completed: false },
    ],
    routeCoordinates: [
      [pickupLat, pickupLng],
      [currentLat, currentLng],
      [destLat, destLng],
    ],
    proofOfDelivery: (row.proof_photo_path || String(row.status || '').toUpperCase() === 'DELIVERED' || String(row.status || '').toUpperCase() === 'COMPLETED') ? {
      receivedBy: row.customer_name || 'Destination Recipient',
      timestamp: row.delivered_at || row.updated_at || new Date().toLocaleString(),
      verificationCode: `POD-${(row.order_id || row.id || fallbackId).slice(-8).toUpperCase()}`,
      proofPhotoPath: row.proof_photo_path || undefined,
      isVerified: String(row.status || '').toUpperCase() === 'COMPLETED',
    } : undefined,
  };
}

function mapAssignmentToDeliveryTracking(row: any, fallbackId: string): DeliveryTracking {
  const currentLat = Number(row.current_lat) || 17.2403;
  const currentLng = Number(row.current_lng) || 78.4294;
  const currentTemp = Number(row.current_temp) || 5.5;
  const humidity = Number(row.humidity) || 85;
  const pickupLat = Number(row.pickup_lat) || 17.0684;
  const pickupLng = Number(row.pickup_lng) || 78.2078;
  const destLat = Number(row.delivery_lat) || 17.4729;
  const destLng = Number(row.delivery_lng) || 78.4842;
  const order = row.orders as any;
  const profile = row.profiles as any;

  const pickupLocation = order?.produce_listings?.location_name || 'Farm Gate Cluster';
  const destinationLocation = order?.delivery_address || 'Agri Wholesale Terminal';
  const currentLocation = 'Highway Cold Corridor';

  return {
    id: row.id || fallbackId,
    tripId: row.id || fallbackId,
    orderId: row.order_id || fallbackId,
    produceName: order?.commodity || order?.produce_listings?.produce_name || 'Fresh Farm Produce',
    totalQuantityKg: Number(order?.quantity || order?.quantity_kg) || 1000,
    status: (row.status || 'IN TRANSIT') as any,
    vehicleType: (row.vehicle_type || 'Tata 407 Reefer') as any,
    vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
    driverName: profile?.full_name || 'Assigned Carrier Driver',
    driverPhone: profile?.phone || '+91 98480 22341',
    pickupLocation,
    destinationLocation,
    currentLocationName: currentLocation,
    currentCoordinates: [currentLat, currentLng],
    pickupCoordinates: [pickupLat, pickupLng],
    destinationCoordinates: [destLat, destLng],
    estimatedArrival: 'Today, 05:45 PM',
    distanceRemainingKm: 25,
    distanceCompletedKm: 50,
    totalDistanceKm: 75,
    progressPercentage: 66,
    etaMinutes: 40,
    telemetry: {
      temperatureCelsius: currentTemp,
      targetTempCelsius: Number(row.target_temp) || 5.0,
      humidityPercent: humidity,
      safeWindowHours: 4,
      safeWindowMinutes: 30,
      spoilageRisk: (row.spoilage_risk || 'LOW') as any,
      reeferActive: true,
      explanation: 'Authoritative assignment cold chain monitored.',
    },
    waypoints: [
      { id: 'wp-1', title: 'Pickup Verified', location: pickupLocation, coordinates: [pickupLat, pickupLng], timestamp: '08:30 AM', completed: true },
      { id: 'wp-2', title: 'Carrier in Transit', location: currentLocation, coordinates: [currentLat, currentLng], timestamp: 'Live', completed: true, current: true },
      { id: 'wp-3', title: 'Destination Terminal', location: destinationLocation, coordinates: [destLat, destLng], timestamp: 'ETA', completed: false },
    ],
    routeCoordinates: [
      [pickupLat, pickupLng],
      [currentLat, currentLng],
      [destLat, destLng],
    ],
    proofOfDelivery: (row.proof_photo_path || String(row.status || '').toLowerCase() === 'delivered' || String(row.status || '').toLowerCase() === 'completed') ? {
      receivedBy: order?.customer_id || 'Destination Recipient',
      timestamp: row.updated_at || new Date().toLocaleString(),
      verificationCode: `POD-${(row.order_id || row.id || fallbackId).slice(-8).toUpperCase()}`,
      proofPhotoPath: row.proof_photo_path || undefined,
      isVerified: String(row.status || '').toLowerCase() === 'completed',
    } : undefined,
  };
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [activeTripId, setActiveTripId] = useState<string>(DEFAULT_TRIP_ID);
  const [activeTrip, setActiveTrip] = useState<DeliveryTracking | null>(null);
  const activeTripRef = useRef<DeliveryTracking | null>(null);
  activeTripRef.current = activeTrip;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!activeTripId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check authoritative public.logistics_assignments first
      const { data: assignment } = await supabase
        .from('logistics_assignments')
        .select(`
          id,
          order_id,
          operator_id,
          proof_photo_path,
          pickup_lat,
          pickup_lng,
          delivery_lat,
          delivery_lng,
          current_lat,
          current_lng,
          status,
          vehicle_number,
          vehicle_type,
          current_temp,
          target_temp,
          humidity,
          spoilage_risk,
          created_at,
          updated_at,
          orders (
            id,
            order_number,
            commodity,
            quantity,
            quantity_kg,
            status,
            delivery_address,
            produce_listings (
              produce_name,
              location_name
            )
          ),
          profiles:operator_id (
            id,
            full_name,
            phone
          )
        `)
        .or(`id.eq.${activeTripId},order_id.eq.${activeTripId}`)
        .maybeSingle();

      if (assignment) {
        setActiveTrip(mapAssignmentToDeliveryTracking(assignment, activeTripId));
        return;
      }

      // 2. Query legacy Supabase public.logistics_trips
      const { data, error: dbError } = await supabase
        .from('logistics_trips')
        .select('*')
        .or(`id.eq.${activeTripId},order_id.eq.${activeTripId},trip_code.eq.${activeTripId}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveTrip(mapLogisticsRowToDeliveryTracking(data, activeTripId));
      } else {
        // Fallback to shared tracking service if database row not yet created
        const fallbackData = await sharedTrackingService.getTracking(activeTripId);
        setActiveTrip(fallbackData);
      }
    } catch (err) {
      console.warn('Tracking fetch warning, falling back to shared tracking:', err);
      const fallbackData = await sharedTrackingService.getTracking(activeTripId);
      setActiveTrip(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, [activeTripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Active Supabase realtime stream subscription listening for live updates on logistics_assignments and logistics_trips
  useEffect(() => {
    if (!activeTripId) return;

    const channel = supabase
      .channel(`realtime-logistics-${activeTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_assignments',
        },
        () => {
          fetchTrip();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logistics_trips',
        },
        (payload) => {
          const updatedRow = payload.new as any;
          if (!updatedRow) return;

          // Check if event targets our currently tracked shipment
          const currentTrip = activeTripRef.current;
          const matches =
            updatedRow.id === activeTripId ||
            updatedRow.order_id === activeTripId ||
            updatedRow.trip_code === activeTripId ||
            (currentTrip && (updatedRow.id === currentTrip.id || updatedRow.id === currentTrip.tripId));

          if (matches) {
            setActiveTrip((prev) => {
              if (!prev) {
                return mapLogisticsRowToDeliveryTracking(updatedRow, activeTripId);
              }

              const prevLat = prev.currentCoordinates ? prev.currentCoordinates[0] : 17.3850;
              const prevLng = prev.currentCoordinates ? prev.currentCoordinates[1] : 78.4867;
              const newLat = Number(updatedRow.current_lat) || prevLat;
              const newLng = Number(updatedRow.current_lng) || prevLng;
              const newTemp = updatedRow.current_temp != null ? Number(updatedRow.current_temp) : prev.telemetry.temperatureCelsius;
              const newHumidity = updatedRow.humidity != null ? Number(updatedRow.humidity) : prev.telemetry.humidityPercent;

              const positionChanged =
                newLat !== prevLat || newLng !== prevLng;

              return {
                ...prev,
                status: (updatedRow.status as any) || prev.status,
                currentLocationName: updatedRow.current_location || prev.currentLocationName,
                currentCoordinates: [newLat, newLng],
                distanceRemainingKm: Number(updatedRow.distance_remaining_km) || prev.distanceRemainingKm,
                telemetry: {
                  ...prev.telemetry,
                  temperatureCelsius: newTemp,
                  humidityPercent: newHumidity,
                  spoilageRisk: (updatedRow.spoilage_risk as any) || prev.telemetry.spoilageRisk,
                  reeferActive: updatedRow.reefer_active ?? prev.telemetry.reeferActive,
                },
                routeCoordinates: positionChanged
                  ? [...prev.routeCoordinates, [newLat, newLng]]
                  : prev.routeCoordinates,
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTripId, fetchTrip]);

  const getTrip = useCallback((id: string): DeliveryTracking | null => {
    if (id === activeTrip?.id || id === activeTrip?.tripId || id === activeTrip?.orderId) {
      return activeTrip;
    }
    return null;
  }, [activeTrip]);

  return (
    <TrackingContext.Provider
      value={{
        getTrip,
        activeTrip,
        setActiveTripId,
        isLoading,
        error,
        refreshTrip: fetchTrip,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}
