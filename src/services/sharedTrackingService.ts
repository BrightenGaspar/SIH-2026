import { DeliveryTracking } from '@/types/delivery';
import { supabase } from '@/lib/supabase';

function mapRowToDeliveryTracking(row: any): DeliveryTracking {
  const currentTemp = row.current_temp != null ? Number(row.current_temp) : undefined;
  const currentLat = row.current_lat != null ? Number(row.current_lat) : undefined;
  const currentLng = row.current_lng != null ? Number(row.current_lng) : undefined;
  const humidity = row.humidity != null ? Number(row.humidity) : undefined;
  const pickup = row.source_hub || row.pickup_location || 'Origin Hub';
  const dest = row.destination_hub || row.destination_location || 'Destination Terminal';

  return {
    id: row.id,
    tripId: row.trip_code || `TRIP-${row.id}`,
    orderId: row.order_id || `ORD-${row.id}`,
    produceName: row.commodity || 'Farm Harvest',
    totalQuantityKg: Number(row.total_kg) || 0,
    status: (row.status || 'IN TRANSIT') as any,
    vehicleType: row.vehicle_type || 'Tata 407 Reefer',
    vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
    driverName: row.driver_name || 'Fleet Driver',
    driverPhone: row.driver_phone || undefined,
    pickupLocation: pickup,
    destinationLocation: dest,
    currentLocationName: row.current_location || (currentLat ? `${currentLat.toFixed(3)}, ${currentLng?.toFixed(3)}` : 'In Transit'),
    currentCoordinates: currentLat != null && currentLng != null ? [currentLat, currentLng] : undefined as any,
    pickupCoordinates: row.pickup_lat && row.pickup_lng ? [Number(row.pickup_lat), Number(row.pickup_lng)] : undefined as any,
    destinationCoordinates: row.dest_lat && row.dest_lng ? [Number(row.dest_lat), Number(row.dest_lng)] : undefined as any,
    estimatedArrival: row.estimated_arrival || 'En Route',
    distanceRemainingKm: Math.max(0, (Number(row.total_distance_km) || 74) - (Number(row.distance_completed_km) || 0)),
    distanceCompletedKm: Number(row.distance_completed_km) || 0,
    totalDistanceKm: Number(row.total_distance_km) || 74,
    progressPercentage: Number(row.route_progress) ? Math.round(Number(row.route_progress) * 100) : 0,
    etaMinutes: 45,
    telemetry: {
      temperatureCelsius: currentTemp as any,
      targetTempCelsius: Number(row.target_temp) || 6.0,
      humidityPercent: humidity as any,
      safeWindowHours: currentTemp && currentTemp > 8.0 ? 2 : 4,
      safeWindowMinutes: 0,
      spoilageRisk: (row.spoilage_risk || (currentTemp && currentTemp > 8.0 ? 'HIGH' : 'LOW')) as any,
      reeferActive: Boolean(row.reefer_active ?? (currentTemp != null)),
      explanation: currentTemp != null
        ? `Reefer operational at ${currentTemp}°C.`
        : 'Telemetry awaiting device transmission.',
    },
    waypoints: [
      { id: 'wp-1', title: 'Produce Loaded', location: pickup, coordinates: [currentLat ?? 17.3850, currentLng ?? 78.4867], timestamp: 'Farm Gate', completed: true },
      { id: 'wp-2', title: 'Vehicle Dispatched', location: pickup, coordinates: [currentLat ?? 17.3850, currentLng ?? 78.4867], timestamp: 'Recorded', completed: true },
      { id: 'wp-3', title: 'In Transit', location: row.current_location || 'Corridor', coordinates: [currentLat ?? 17.3850, currentLng ?? 78.4867], timestamp: 'Live Telemetry', completed: true, current: true },
      { id: 'wp-4', title: 'Arrival at Destination', location: dest, coordinates: [currentLat ?? 17.3850, currentLng ?? 78.4867], timestamp: 'Pending', completed: false },
    ],
    routeCoordinates: currentLat != null && currentLng != null ? [[currentLat, currentLng]] : [],
  };
}

export const sharedTrackingService = {
  async getAllTrips(): Promise<DeliveryTracking[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data.map(mapRowToDeliveryTracking);
    } catch {
      return [];
    }
  },

  async getTracking(id: string): Promise<DeliveryTracking | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .or(`id.eq.${id},order_id.eq.${id},trip_code.eq.${id}`)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapRowToDeliveryTracking(data);
    } catch {
      return null;
    }
  },

  async getTrackingByOrderId(orderId: string): Promise<DeliveryTracking | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .eq('order_id', orderId)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapRowToDeliveryTracking(data);
    } catch {
      return null;
    }
  },

  subscribe(tripId: string, onUpdate: (trip: DeliveryTracking) => void): () => void {
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
            onUpdate(mapRowToDeliveryTracking(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
