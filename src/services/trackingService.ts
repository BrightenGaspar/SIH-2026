import { Order, RoadLogisticsTracking, OrderStatus } from '@/types/farmer';
import { supabase } from '@/lib/supabase';

function mapRowToTracking(row: any): RoadLogisticsTracking {
  const currentTemp = Number(row.current_temp) || 6.2;
  const currentLat = Number(row.current_lat) || 17.2403;
  const currentLng = Number(row.current_lng) || 78.4294;
  const humidity = Number(row.humidity) || 88;
  const pickupLocation = row.pickup_location || row.source_hub || 'Shadnagar FPO Hub, Telangana';
  const destinationLocation = row.destination_location || row.destination_hub || 'Bowenpally Agri Hub, Hyderabad';
  const currentLocation = row.current_location || 'Shamshabad Outer Ring Road Tollway';
  const status: OrderStatus = (row.status || 'In Transit') as OrderStatus;

  return {
    id: row.id,
    orderId: row.order_id || `ORD-${row.id}`,
    vehicleType: (row.vehicle_type || 'Tata 407 Reefer') as any,
    vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
    driverName: row.driver_name || 'Mohammed Ismail',
    driverPhone: row.driver_phone || '+91 98480 22341',
    pickupLocation,
    destinationLocation,
    currentLocationName: currentLocation,
    currentCoordinates: [currentLat, currentLng],
    pickupCoordinates: [Number(row.pickup_lat) || 17.0684, Number(row.pickup_lng) || 78.2078],
    destinationCoordinates: [Number(row.dest_lat) || 17.4729, Number(row.dest_lng) || 78.4842],
    estimatedArrival: row.estimated_arrival || 'Today, 05:45 PM',
    status,
    progressPercent: Number(row.progress_percent) || 68,
    distanceRemainingKm: Number(row.distance_remaining_km) || 28,
    totalDistanceKm: Number(row.total_distance_km) || 74,
    isSimulatedGPS: Boolean(row.is_simulated_gps ?? true),
    spoilageTelemetry: {
      temperatureCelsius: currentTemp,
      targetTempCelsius: Number(row.target_temp) || 6.0,
      humidityPercent: humidity,
      safeWindowHours: Number(row.safe_window_hours) || 4,
      safeWindowMinutes: Number(row.safe_window_minutes) || 30,
      riskLevel: (row.spoilage_risk || 'Low') as any,
      isSimulated: false,
    },
    returnLoad: row.return_route
      ? {
          id: row.return_load_id || `RET-${row.id}`,
          origin: destinationLocation,
          destination: pickupLocation,
          commodity: row.return_commodity || 'Organic Fertilizer Sacks & Seedlings',
          additionalEarnings: Number(row.return_earnings) || 2800,
          emptyDistanceAvoidedKm: Number(row.return_distance_saved_km) || 142,
          status: 'Available',
          isDemoData: false,
        }
      : undefined,
    timeline: row.timeline || [
      { title: 'Produce Loaded & Graded', location: pickupLocation, timestamp: '09:30 AM', completed: true },
      { title: 'Driver Assigned & Inspected', location: `${row.vehicle_type || 'Tata 407 Reefer'} (${row.vehicle_number || 'TS 08 UB 4192'})`, timestamp: '10:00 AM', completed: true },
      { title: 'Trip Started (Road Route)', location: `Departed ${pickupLocation}`, timestamp: '10:30 AM', completed: true },
      { title: 'In Transit - Live Cold Chain Active', location: currentLocation, timestamp: '03:15 PM', completed: true, current: true },
      { title: 'Arrival at Destination', location: destinationLocation, timestamp: '05:45 PM (ETA)', completed: false },
      { title: 'Unloading & Payment Release', location: 'Inspection Gate 3', timestamp: 'Pending', completed: false },
    ],
  };
}

export const trackingService = {
  /**
   * Fetch all farmer orders live from public.orders table
   */
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase getOrders error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        buyerName: row.buyer_name || (row.profiles as any)?.full_name || 'AgriFlow Verified Buyer',
        buyerType: row.buyer_type || 'Institutional Buyer',
        produceName: row.commodity || row.produce_name || 'Farm Harvest',
        quantityKg: Number(row.quantity_kg) || 0,
        grade: (row.grade || 'A') as any,
        pricePerKg: Number(row.price_per_kg) || (Number(row.total_amount) / (Number(row.quantity_kg) || 1)),
        totalOrderValue: Number(row.total_amount) || 0,
        orderDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        pickupDate: row.pickup_date || 'Scheduled for Pickup',
        deliveryDate: row.delivery_date,
        status: (row.status || 'In Transit') as OrderStatus,
        logisticsId: row.logistics_id || row.id,
        destinationCity: row.delivery_city || row.destination_city || 'Hyderabad, Telangana',
      }));
    } catch (err: any) {
      console.warn('Error querying orders in Supabase:', err?.message);
      return [];
    }
  },

  /**
   * Fetch real-time road logistics tracking details from public.logistics_trips
   */
  async getTrackingDetails(logisticsId: string): Promise<RoadLogisticsTracking | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .or(`id.eq.${logisticsId},order_id.eq.${logisticsId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Supabase error fetching tracking details:', error.message);
        return null;
      }

      if (!data) {
        return null;
      }

      return mapRowToTracking(data);
    } catch (err: any) {
      console.warn('Error fetching tracking from Supabase:', err?.message);
      return null;
    }
  },

  /**
   * Directly update truck GPS latitude and longitude in public.logistics_trips
   */
  async updateTruckLocation(
    logisticsId: string,
    lat: number,
    lng: number,
    locationName?: string
  ): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString(),
      };
      if (locationName) updateData.current_location = locationName;

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .or(`id.eq.${logisticsId},order_id.eq.${logisticsId}`);

      if (error) {
        console.error('Supabase error updating truck location:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Error updating truck location:', err?.message);
      return false;
    }
  },

  /**
   * Directly update truck latitude, longitude, temperature, and humidity live in public.logistics_trips
   */
  async updateTruckTelemetry(
    logisticsId: string,
    telemetry: {
      currentLat?: number;
      currentLng?: number;
      currentTemp?: number;
      currentHumidity?: number;
      status?: OrderStatus;
      currentLocationName?: string;
    }
  ): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (telemetry.currentLat !== undefined) updateData.current_lat = telemetry.currentLat;
      if (telemetry.currentLng !== undefined) updateData.current_lng = telemetry.currentLng;
      if (telemetry.currentTemp !== undefined) updateData.current_temp = telemetry.currentTemp;
      if (telemetry.currentHumidity !== undefined) updateData.humidity = telemetry.currentHumidity;
      if (telemetry.status !== undefined) updateData.status = telemetry.status;
      if (telemetry.currentLocationName !== undefined) updateData.current_location = telemetry.currentLocationName;

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .or(`id.eq.${logisticsId},order_id.eq.${logisticsId}`);

      if (error) {
        console.error('Supabase error updating truck telemetry:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Error updating truck telemetry:', err?.message);
      return false;
    }
  },

  /**
   * Create a new logistics trip directly in public.logistics_trips
   */
  async createTrip(tripData: {
    id?: string;
    orderId?: string;
    vehicleNumber: string;
    vehicleType?: string;
    driverName: string;
    driverPhone?: string;
    pickupLocation: string;
    destinationLocation: string;
    currentLocationName?: string;
    currentLat?: number;
    currentLng?: number;
    currentTemp?: number;
    humidity?: number;
    status?: OrderStatus;
  }): Promise<RoadLogisticsTracking | null> {
    try {
      const tripId = tripData.id || `TRK-RD-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: tripId,
        order_id: tripData.orderId || null,
        vehicle_number: tripData.vehicleNumber,
        vehicle_type: tripData.vehicleType || 'Tata 407 Reefer',
        driver_name: tripData.driverName,
        driver_phone: tripData.driverPhone || null,
        pickup_location: tripData.pickupLocation,
        destination_location: tripData.destinationLocation,
        current_location: tripData.currentLocationName || tripData.pickupLocation,
        current_lat: tripData.currentLat ?? 17.2403,
        current_lng: tripData.currentLng ?? 78.4294,
        current_temp: tripData.currentTemp ?? 6.2,
        target_temp: 6.0,
        humidity: tripData.humidity ?? 88,
        status: tripData.status || 'In Transit',
        spoilage_risk: 'Low',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('logistics_trips')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating trip:', error.message);
        return null;
      }

      return mapRowToTracking(data);
    } catch (err: any) {
      console.error('Error creating trip in Supabase:', err?.message);
      return null;
    }
  },
};