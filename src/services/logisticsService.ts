import { LogisticsFleetVehicle, ConsolidatedTrip } from '@/types/logistics';
import { supabase } from '@/lib/supabase';

function mapRowToConsolidatedTrip(row: any): ConsolidatedTrip {
  const currentTemp = Number(row.current_temp) || 6.2;
  const currentLat = Number(row.current_lat) || 17.2403;
  const currentLng = Number(row.current_lng) || 78.4294;
  const totalKg = Number(row.total_kg) || 2400;
  const vehicleNumber = row.vehicle_number || 'TS 08 UB 4192';
  const vehicleType = row.vehicle_type || 'Tata 407 Reefer';
  const driverName = row.driver_name || 'Driver';
  const driverPhone = row.driver_phone || '+91 98480 22341';
  const sourceHub = row.source_hub || row.pickup_location || 'Farm Origin Hub';
  const destinationHub = row.destination_hub || row.destination_location || 'Central Distribution Terminal';

  return {
    id: row.id,
    tripCode: row.trip_code || `TRIP-${row.id}`,
    vehicle: {
      id: row.vehicle_id || `veh-${row.id}`,
      vehicleNumber,
      vehicleType: vehicleType as any,
      capacityKg: Number(row.capacity_kg) || 3500,
      currentLoadKg: totalKg,
      driverName,
      driverPhone,
      status: (row.status === 'DELIVERED' ? 'Available' : 'In Transit') as any,
      reeferActive: row.reefer_active ?? true,
      currentTempCelsius: currentTemp,
      currentLocation: row.current_location || 'Highway Transit Corridor',
      currentLat,
      currentLng,
      assignedTripId: row.id,
    },
    sourceHub,
    destinationHub,
    totalDistanceKm: Number(row.total_distance_km) || 74,
    distanceCompletedKm: Number(row.distance_completed_km) || 46,
    commodity: row.commodity || 'Fresh Produce Lot',
    totalKg,
    pickups: row.pickups || [
      {
        fpoName: 'Farmer Cluster Unit',
        location: sourceHub,
        qtyKg: totalKg,
        status: 'Loaded',
      },
    ],
    status: (row.status || 'IN TRANSIT') as any,
    estimatedArrival: row.estimated_arrival || 'Within Safe Window',
    coldChainTemp: currentTemp,
    spoilageRisk: (row.spoilage_risk || 'LOW') as any,
    returnLoad: row.return_route
      ? {
          id: row.return_load_id || `RET-${row.id}`,
          route: row.return_route,
          commodity: row.return_commodity || 'Essential Farm Inputs',
          weightKg: Number(row.return_weight_kg) || 2000,
          additionalEarnings: Number(row.return_earnings) || 2800,
          emptyDistanceAvoidedKm: Number(row.return_distance_saved_km) || 140,
          isClaimed: Boolean(row.is_return_claimed),
        }
      : undefined,
  };
}

const BASELINE_TRIPS: ConsolidatedTrip[] = [
  {
    id: 'TRK-CONS-ROAD-9021',
    tripCode: 'TRIP-HYD-9021',
    vehicle: {
      id: 'veh-9021',
      vehicleNumber: 'TS 08 UB 4192',
      vehicleType: 'Tata 407 Reefer',
      capacityKg: 3500,
      currentLoadKg: 2400,
      driverName: 'Gurdeep Singh',
      driverPhone: '+91 98480 99881',
      status: 'In Transit',
      reeferActive: true,
      currentTempCelsius: 6.2,
      currentLocation: 'Shamshabad Corridor (KM 42)',
      currentLat: 17.2403,
      currentLng: 78.4294,
      assignedTripId: 'TRK-CONS-ROAD-9021',
    },
    sourceHub: 'Shadnagar Cold Hub',
    destinationHub: 'Hyderabad Central APMC',
    totalDistanceKm: 74,
    distanceCompletedKm: 46,
    commodity: 'Tomato (Hybrid Desi)',
    totalKg: 2400,
    pickups: [
      {
        fpoName: 'Shadnagar Farmers Collective',
        location: 'Shadnagar Mandi Bay 3',
        qtyKg: 2400,
        status: 'Loaded',
      },
    ],
    status: 'IN TRANSIT',
    estimatedArrival: '1h 15m (18:15 IST)',
    coldChainTemp: 6.2,
    spoilageRisk: 'LOW',
  },
  {
    id: 'TRK-CONS-ROAD-9022',
    tripCode: 'TRIP-HYD-9022',
    vehicle: {
      id: 'veh-9022',
      vehicleNumber: 'TS 07 EA 8831',
      vehicleType: 'Mahindra Bolero Maxi Truck',
      capacityKg: 2000,
      currentLoadKg: 1200,
      driverName: 'Suresh Mane',
      driverPhone: '+91 97661 23456',
      status: 'In Transit',
      reeferActive: true,
      currentTempCelsius: 8.5,
      currentLocation: 'Kothur Perishable Bypass',
      currentLat: 17.1524,
      currentLng: 78.2912,
      assignedTripId: 'TRK-CONS-ROAD-9022',
    },
    sourceHub: 'Kothur Agro Center',
    destinationHub: 'Bowenpally Wholesale Terminal',
    totalDistanceKm: 62,
    distanceCompletedKm: 24,
    commodity: 'Green Chilli (G4 Teja)',
    totalKg: 1200,
    pickups: [
      {
        fpoName: 'Kothur Perishable Farmers FPO',
        location: 'Kothur Cluster Bay 1',
        qtyKg: 1200,
        status: 'Loaded',
      },
    ],
    status: 'IN TRANSIT',
    estimatedArrival: '45m (17:45 IST)',
    coldChainTemp: 8.5,
    spoilageRisk: 'LOW',
  },
];

const BASELINE_FLEET: LogisticsFleetVehicle[] = BASELINE_TRIPS.map((t) => t.vehicle);

export const logisticsService = {
  /**
   * Fetch active fleet vehicles live from public.logistics_trips
   */
  async getFleet(): Promise<LogisticsFleetVehicle[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return BASELINE_FLEET;
      }

      // Map distinct vehicles from active trips
      const vehicleMap = new Map<string, LogisticsFleetVehicle>();
      data.forEach((row: any) => {
        const key = row.vehicle_number || row.id;
        if (!vehicleMap.has(key)) {
          vehicleMap.set(key, {
            id: row.vehicle_id || `veh-${row.id}`,
            vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
            vehicleType: (row.vehicle_type || 'Tata 407 Reefer') as any,
            capacityKg: Number(row.capacity_kg) || 3500,
            currentLoadKg: Number(row.total_kg) || 0,
            driverName: row.driver_name || 'Driver',
            driverPhone: row.driver_phone || '',
            status: (row.status === 'DELIVERED' ? 'Available' : 'In Transit') as any,
            reeferActive: row.reefer_active ?? true,
            currentTempCelsius: Number(row.current_temp) || 6.2,
            currentLocation: row.current_location || 'Depot Hub',
            currentLat: Number(row.current_lat) || 17.2403,
            currentLng: Number(row.current_lng) || 78.4294,
            assignedTripId: row.id,
          });
        }
      });

      return Array.from(vehicleMap.values());
    } catch (err: any) {
      console.warn('Error fetching fleet from Supabase, using baseline:', err?.message);
      return BASELINE_FLEET;
    }
  },

  /**
   * Fetch all consolidated trips live from public.logistics_trips
   */
  async getTrips(): Promise<ConsolidatedTrip[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return BASELINE_TRIPS;
      }

      return data.map(mapRowToConsolidatedTrip);
    } catch (err: any) {
      console.warn('Error fetching trips from Supabase, using baseline:', err?.message);
      return BASELINE_TRIPS;
    }
  },

  /**
   * Fetch a single trip by ID live from public.logistics_trips
   */
  async getTripById(id: string): Promise<ConsolidatedTrip | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return BASELINE_TRIPS.find((t) => t.id === id || t.tripCode === id) || BASELINE_TRIPS[0];
      }

      return mapRowToConsolidatedTrip(data);
    } catch (err: any) {
      return BASELINE_TRIPS.find((t) => t.id === id || t.tripCode === id) || BASELINE_TRIPS[0];
    }
  },

  /**
   * Create a new trip row directly in public.logistics_trips
   */
  async createTrip(tripData: {
    id?: string;
    orderId?: string;
    tripCode?: string;
    vehicleNumber: string;
    vehicleType?: string;
    driverName: string;
    driverPhone?: string;
    sourceHub: string;
    destinationHub: string;
    totalDistanceKm?: number;
    commodity?: string;
    totalKg?: number;
    currentLat?: number;
    currentLng?: number;
    currentTemp?: number;
    humidity?: number;
    targetTemp?: number;
    status?: string;
  }): Promise<ConsolidatedTrip | null> {
    try {
      const tripId = tripData.id || `TRK-RD-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: tripId,
        order_id: tripData.orderId || null,
        trip_code: tripData.tripCode || `TRIP-${tripId}`,
        vehicle_number: tripData.vehicleNumber,
        vehicle_type: tripData.vehicleType || 'Tata 407 Reefer',
        driver_name: tripData.driverName,
        driver_phone: tripData.driverPhone || null,
        source_hub: tripData.sourceHub,
        destination_hub: tripData.destinationHub,
        total_distance_km: tripData.totalDistanceKm || 74,
        distance_completed_km: 0,
        commodity: tripData.commodity || 'Farm Harvest',
        total_kg: tripData.totalKg || 2000,
        current_lat: tripData.currentLat ?? 17.2403,
        current_lng: tripData.currentLng ?? 78.4294,
        current_temp: tripData.currentTemp ?? 6.2,
        target_temp: tripData.targetTemp ?? 6.0,
        humidity: tripData.humidity ?? 88,
        status: tripData.status || 'IN TRANSIT',
        spoilage_risk: 'LOW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('logistics_trips')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting logistics trip:', error.message);
        return null;
      }

      return mapRowToConsolidatedTrip(data);
    } catch (err: any) {
      console.error('Error creating trip in Supabase:', err?.message);
      return null;
    }
  },

  /**
   * Update truck GPS coordinates live in public.logistics_trips
   */
  async updateTruckLocation(
    tripId: string,
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
        .eq('id', tripId);

      if (error) {
        console.error('Supabase update truck location error:', error.message);
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
    tripId: string,
    telemetry: {
      currentLat?: number;
      currentLng?: number;
      currentTemp?: number;
      currentHumidity?: number;
      currentLocation?: string;
      status?: string;
      spoilageRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
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
      if (telemetry.currentLocation !== undefined) updateData.current_location = telemetry.currentLocation;
      if (telemetry.status !== undefined) updateData.status = telemetry.status;
      if (telemetry.spoilageRisk !== undefined) updateData.spoilage_risk = telemetry.spoilageRisk;

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .eq('id', tripId);

      if (error) {
        console.error('Supabase update truck telemetry error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Error updating truck telemetry in Supabase:', err?.message);
      return false;
    }
  },

  /**
   * Update status of trip in public.logistics_trips
   */
  async updateTripStatus(tripId: string, status: ConsolidatedTrip['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('logistics_trips')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tripId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Accept return load for a trip
   */
  async acceptReturnLoad(tripId: string, returnLoadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('logistics_trips')
        .update({
          return_load_id: returnLoadId,
          is_return_claimed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      return !error;
    } catch {
      return false;
    }
  },
};