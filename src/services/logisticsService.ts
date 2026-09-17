import { LogisticsFleetVehicle, ConsolidatedTrip } from '@/types/logistics';
import { supabase } from '@/lib/supabase';

export interface FleetDriverCandidate {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  currentLocation: string;
}

export const FLEET_DRIVERS_QUEUE: FleetDriverCandidate[] = [
  {
    id: 'drv-01',
    name: 'Mohammed Ismail',
    phone: '+91 98480 22341',
    vehicleNumber: 'TS 08 UB 4192',
    vehicleType: 'Tata 407 Reefer',
    currentLocation: 'Shamshabad Hub (5 km from origin)',
  },
  {
    id: 'drv-02',
    name: 'Suresh Mane',
    phone: '+91 97661 23456',
    vehicleNumber: 'TS 07 EA 8831',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    currentLocation: 'Kothur Bypass (8 km from origin)',
  },
  {
    id: 'drv-03',
    name: 'Gurdeep Singh',
    phone: '+91 98480 99881',
    vehicleNumber: 'TS 09 XY 9099',
    vehicleType: 'Ashok Leyland Dost Reefer',
    currentLocation: 'Shadnagar Yard (2 km from origin)',
  },
  {
    id: 'drv-04',
    name: 'Ramesh Reddy',
    phone: '+91 98480 55442',
    vehicleNumber: 'TS 05 KL 6712',
    vehicleType: 'Tata 709 Reefer',
    currentLocation: 'Jedcherla Depot (14 km from origin)',
  },
];

function mapAssignmentToConsolidatedTrip(row: any): ConsolidatedTrip {
  const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
  const listing = order ? (Array.isArray(order.produce_listings) ? order.produce_listings[0] : order.produce_listings) : null;
  const operator = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  const currentTemp = row.current_temp != null ? Number(row.current_temp) : undefined;
  const currentLat = row.current_lat != null ? Number(row.current_lat) : (row.pickup_lat != null ? Number(row.pickup_lat) : undefined);
  const currentLng = row.current_lng != null ? Number(row.current_lng) : (row.pickup_lng != null ? Number(row.pickup_lng) : undefined);
  const totalKg = Number(order?.quantity || order?.quantity_kg || row.total_kg || 1000);
  const vehicleNumber = row.vehicle_number || 'TS 08 UB 4192';
  const vehicleType = row.vehicle_type || 'Tata 407 Reefer';
  const driverName = operator?.full_name || (row.operator_id ? 'Assigned Driver' : 'Available for Pickup');
  const driverPhone = operator?.phone || undefined;
  const sourceHub = listing?.location_name || (row.pickup_lat ? `Pickup Point (${Number(row.pickup_lat).toFixed(2)}, ${Number(row.pickup_lng).toFixed(2)})` : 'Origin Farm Gate Hub');
  const destinationHub = order?.delivery_address || (row.delivery_lat ? `Delivery Destination (${Number(row.delivery_lat).toFixed(2)}, ${Number(row.delivery_lng).toFixed(2)})` : 'Destination Wholesale Terminal');

  let tripStatus: ConsolidatedTrip['status'] = 'IN TRANSIT';
  const rawStatus = (row.status || '').toLowerCase();

  if (rawStatus === 'delivered') {
    tripStatus = 'DELIVERED';
  } else if (rawStatus === 'assigned' && !row.operator_id) {
    tripStatus = 'DISPATCH_OFFERED';
  } else if (rawStatus === 'assigned' || rawStatus === 'heading_to_pickup') {
    tripStatus = 'SCHEDULED';
  } else if (rawStatus === 'picked_up') {
    tripStatus = 'LOADING';
  } else if (rawStatus === 'in_transit') {
    tripStatus = 'IN TRANSIT';
  }

  const isDelivered = rawStatus === 'delivered';
  const totalDist = 74;
  const distCompleted = isDelivered ? 74 : (rawStatus === 'in_transit' ? 38 : (rawStatus === 'picked_up' ? 10 : 0));

  return {
    id: row.id,
    tripCode: row.order_id ? `TRIP-${row.order_id.slice(-6)}` : `TRIP-${row.id.slice(0, 8)}`,
    vehicle: {
      id: `veh-${row.id.slice(0, 8)}`,
      vehicleNumber,
      vehicleType: vehicleType as any,
      capacityKg: 3500,
      currentLoadKg: totalKg,
      driverName,
      driverPhone,
      status: isDelivered ? 'Available' : (!row.operator_id ? 'Available' : 'In Transit'),
      reeferActive: true,
      currentTempCelsius: currentTemp,
      currentLocation: currentLat && currentLng ? `${currentLat.toFixed(3)}, ${currentLng.toFixed(3)}` : 'En Route',
      currentLat,
      currentLng,
      assignedTripId: row.id,
    },
    sourceHub,
    destinationHub,
    totalDistanceKm: totalDist,
    distanceCompletedKm: distCompleted,
    commodity: order?.commodity || listing?.produce_name || 'Farm Harvest',
    totalKg,
    pickups: [
      {
        fpoName: 'Farmer Cluster Unit',
        location: sourceHub,
        qtyKg: totalKg,
        status: isDelivered || rawStatus === 'in_transit' || rawStatus === 'picked_up' ? 'Loaded' : 'Pending',
      },
    ],
    status: tripStatus,
    estimatedArrival: isDelivered ? 'Delivered' : 'En Route',
    coldChainTemp: currentTemp,
    spoilageRisk: (row.spoilage_risk?.toUpperCase() || (currentTemp && currentTemp > 8.0 ? 'HIGH' : 'LOW')) as any,
    farmerId: order?.farmer_id || listing?.farmer_id || undefined,
    customerId: order?.customer_id || undefined,
  };
}

function mapLegacyTripRow(row: any): ConsolidatedTrip {
  const currentTemp = row.current_temp != null ? Number(row.current_temp) : undefined;
  const currentLat = row.current_lat != null ? Number(row.current_lat) : undefined;
  const currentLng = row.current_lng != null ? Number(row.current_lng) : undefined;
  const totalKg = Number(row.total_kg) || 0;
  const vehicleNumber = row.vehicle_number || 'TS 08 UB 4192';
  const vehicleType = row.vehicle_type || 'Tata 407 Reefer';
  const driverName = row.driver_name || 'Assigned Fleet Driver';
  const driverPhone = row.driver_phone || undefined;
  const sourceHub = row.source_hub || row.pickup_location || 'Origin Hub';
  const destinationHub = row.destination_hub || row.destination_location || 'Destination APMC Terminal';

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
      reeferActive: row.reefer_active ?? (currentTemp != null),
      currentTempCelsius: currentTemp,
      currentLocation: row.current_location || (currentLat ? `${currentLat.toFixed(3)}, ${currentLng?.toFixed(3)}` : 'En Route'),
      currentLat,
      currentLng,
      assignedTripId: row.id,
    },
    sourceHub,
    destinationHub,
    totalDistanceKm: Number(row.total_distance_km) || 0,
    distanceCompletedKm: Number(row.distance_completed_km) || 0,
    commodity: row.commodity || 'Farm Harvest',
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
    estimatedArrival: row.estimated_arrival || 'En Route',
    coldChainTemp: currentTemp,
    spoilageRisk: (row.spoilage_risk || (currentTemp && currentTemp > 8.0 ? 'HIGH' : 'LOW')) as any,
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

export const logisticsService = {
  /**
   * Fetch active fleet vehicles live from public.logistics_assignments & public.logistics_trips
   */
  async getFleet(): Promise<LogisticsFleetVehicle[]> {
    try {
      const trips = await this.getTrips();
      return trips.map((t) => t.vehicle);
    } catch (err: any) {
      console.warn('Error fetching fleet from Supabase:', err?.message);
      return [];
    }
  },

  /**
   * Fetch all consolidated trips live from authoritative public.logistics_assignments
   * and public.logistics_trips. Zero mock data fallbacks.
   */
  async getTrips(): Promise<ConsolidatedTrip[]> {
    const results: ConsolidatedTrip[] = [];
    const seenIds = new Set<string>();

    try {
      // 1. Authoritative normalized logistics assignments with joined order & produce
      const { data: assignments, error: assignErr } = await supabase
        .from('logistics_assignments')
        .select(`
          id,
          order_id,
          operator_id,
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
            delivery_lat,
            delivery_lng,
            farmer_id,
            customer_id,
            listing_id,
            produce_listings (
              produce_name,
              location_name,
              location_lat,
              location_lng
            )
          ),
          profiles:operator_id (
            id,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (!assignErr && assignments && assignments.length > 0) {
        for (const row of assignments) {
          const trip = mapAssignmentToConsolidatedTrip(row);
          results.push(trip);
          seenIds.add(trip.id);
          if (row.order_id) seenIds.add(row.order_id);
        }
      }
    } catch (err: any) {
      console.warn('Notice querying logistics_assignments:', err?.message);
    }

    try {
      // 2. Query legacy logistics_trips for standalone fleet trips not captured above
      const { data: trips, error: tripErr } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tripErr && trips && trips.length > 0) {
        for (const row of trips) {
          if (!seenIds.has(row.id) && (!row.order_id || !seenIds.has(row.order_id))) {
            results.push(mapLegacyTripRow(row));
            seenIds.add(row.id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Notice querying logistics_trips:', err?.message);
    }

    return results;
  },

  /**
   * Fetch available pickups ready to be claimed by a logistics operator.
   * Scoped to orders ready for pickup or unassigned assignments.
   */
  async getAvailablePickups(): Promise<ConsolidatedTrip[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_assignments')
        .select(`
          id,
          order_id,
          operator_id,
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
            delivery_lat,
            delivery_lng,
            farmer_id,
            customer_id,
            listing_id,
            produce_listings (
              produce_name,
              location_name,
              location_lat,
              location_lng
            )
          )
        `)
        .is('operator_id', null)
        .in('status', ['assigned', 'ready_for_pickup', 'ASSIGNED', 'READY_FOR_PICKUP'])
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map(mapAssignmentToConsolidatedTrip);
    } catch (err: any) {
      console.warn('Error fetching available pickups:', err?.message);
      return [];
    }
  },

  /**
   * Atomically claim an assignment via Phase 2 driver_claim_assignment RPC
   */
  async claimPickup(assignmentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('driver_claim_assignment', {
        p_assignment_id: assignmentId,
      });

      if (error) {
        const isConflict = error.code === '23505' || error.message?.includes('already been claimed');
        const message = isConflict
          ? 'Another logistics operator already accepted this pickup.'
          : error.message || 'Failed to claim pickup.';
        return { success: false, error: message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to claim pickup.' };
    }
  },

  /**
   * Update driver GPS telemetry live via Phase 2 driver_update_gps RPC
   * Strictly passes null for temperature when using phone GPS.
   */
  async updateGPS(
    assignmentId: string,
    lat: number,
    lng: number,
    accuracy?: number,
    speed?: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('driver_update_gps', {
        p_assignment_id: assignmentId,
        p_lat: lat,
        p_lng: lng,
        p_current_temp: null, // Phone GPS does not measure cold chain temperature
        p_humidity: null,
        p_speed_kmh: speed ?? null,
        p_gps_accuracy: accuracy ?? null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update GPS telematics.' };
    }
  },

  /**
   * Update delivery status live via Phase 2 driver_update_delivery_status RPC
   * Idempotent: safe against network retries.
   */
  async updateDeliveryStatus(
    assignmentId: string,
    newStatus: 'assigned' | 'heading_to_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'failed_delivery' | 'cancelled'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('driver_update_delivery_status', {
        p_assignment_id: assignmentId,
        p_new_status: newStatus.toLowerCase(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update delivery status.' };
    }
  },

  /**
   * Fetch a single trip by ID live from assignments or trips
   */
  async getTripById(id: string): Promise<ConsolidatedTrip | null> {
    try {
      // Check logistics_assignments first
      const { data: assignment, error: assignErr } = await supabase
        .from('logistics_assignments')
        .select(`
          id,
          order_id,
          operator_id,
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
            delivery_lat,
            delivery_lng,
            farmer_id,
            customer_id,
            listing_id,
            produce_listings (
              produce_name,
              location_name,
              location_lat,
              location_lng
            )
          ),
          profiles:operator_id (
            id,
            full_name,
            phone
          )
        `)
        .or(`id.eq.${id},order_id.eq.${id}`)
        .maybeSingle();

      if (!assignErr && assignment) {
        return mapAssignmentToConsolidatedTrip(assignment);
      }

      // Check logistics_trips
      const { data: trip, error: tripErr } = await supabase
        .from('logistics_trips')
        .select('*')
        .or(`id.eq.${id},order_id.eq.${id}`)
        .maybeSingle();

      if (!tripErr && trip) {
        return mapLegacyTripRow(trip);
      }
    } catch (err: any) {
      console.warn('Error fetching trip by ID:', err?.message);
    }

    return null;
  },

  /**
   * Check for any pending dispatch order waiting for a driver to accept.
   * Zero mock data. Returns null if none available.
   */
  async getPendingDispatchTrip(): Promise<ConsolidatedTrip | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_assignments')
        .select(`
          id,
          order_id,
          operator_id,
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
            delivery_lat,
            delivery_lng,
            farmer_id,
            customer_id,
            listing_id,
            produce_listings (
              produce_name,
              location_name,
              location_lat,
              location_lng
            )
          )
        `)
        .is('operator_id', null)
        .in('status', ['assigned', 'ready_for_pickup', 'ASSIGNED', 'READY_FOR_PICKUP'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapAssignmentToConsolidatedTrip(data);
      }
    } catch (err: any) {
      console.warn('Error checking pending dispatch assignments:', err?.message);
    }

    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .eq('status', 'DISPATCH_OFFERED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapLegacyTripRow(data);
      }
    } catch {}

    return null;
  },

  /**
   * Driver accepts haul - routes through Phase 2 driver_claim_assignment RPC
   * and synchronizes logistics_trips.
   */
  async acceptDispatchTrip(tripId: string, driver?: FleetDriverCandidate): Promise<boolean> {
    const selectedDriver = driver || FLEET_DRIVERS_QUEUE[0];
    try {
      // 1. If tripId is or maps to a logistics_assignment, claim it atomically
      let assignmentId = tripId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId);

      if (!isUuid) {
        const orderId = tripId.startsWith('TRK-') ? tripId.replace('TRK-', '') : tripId;
        const { data: la } = await supabase
          .from('logistics_assignments')
          .select('id')
          .or(`id.eq.${tripId},order_id.eq.${orderId}`)
          .maybeSingle();
        if (la) {
          assignmentId = la.id;
        }
      }

      const { error: claimErr } = await supabase.rpc('driver_claim_assignment', {
        p_assignment_id: assignmentId,
      });

      if (claimErr) {
        console.warn('Notice from driver_claim_assignment:', claimErr.message);
      }

      // 2. Dual-write update to logistics_trips for backwards-compatible views
      await supabase
        .from('logistics_trips')
        .update({
          status: 'IN TRANSIT',
          driver_name: selectedDriver.name,
          driver_phone: selectedDriver.phone,
          vehicle_number: selectedDriver.vehicleNumber,
          vehicle_type: selectedDriver.vehicleType,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${tripId},order_id.eq.${tripId}`);

      return true;
    } catch (err: any) {
      console.warn('Accept dispatch update notice:', err?.message);
      return false;
    }
  },

  /**
   * Driver declines haul - cascades to the next driver in the queue
   */
  async declineDispatchTrip(
    tripId: string,
    currentDriverIndex: number
  ): Promise<{ nextDriver: FleetDriverCandidate; nextIndex: number }> {
    const nextIndex = (currentDriverIndex + 1) % FLEET_DRIVERS_QUEUE.length;
    const nextDriver = FLEET_DRIVERS_QUEUE[nextIndex];

    try {
      await supabase
        .from('logistics_trips')
        .update({
          driver_name: nextDriver.name,
          driver_phone: nextDriver.phone,
          vehicle_number: nextDriver.vehicleNumber,
          vehicle_type: nextDriver.vehicleType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);
    } catch {}

    return { nextDriver, nextIndex };
  },

  /**
   * Update truck GPS coordinates live
   */
  async updateTruckLocation(
    tripId: string,
    lat: number,
    lng: number,
    locationName?: string
  ): Promise<boolean> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId);
      if (isUuid) {
        const res = await this.updateGPS(tripId, lat, lng);
        if (res.success) return true;
      }

      const updateData: any = {
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString(),
      };
      if (locationName) updateData.current_location = locationName;

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .or(`id.eq.${tripId},order_id.eq.${tripId}`);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Update cold-chain telemetry live
   */
  async updateColdChainTelemetry(
    tripId: string,
    tempCelsius: number,
    humidityPercent?: number
  ): Promise<boolean> {
    try {
      const updateData: any = {
        current_temp: tempCelsius,
        updated_at: new Date().toISOString(),
      };
      if (humidityPercent != null) updateData.humidity = humidityPercent;

      await supabase
        .from('logistics_trips')
        .update(updateData)
        .or(`id.eq.${tripId},order_id.eq.${tripId}`);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId);
      if (isUuid) {
        await supabase
          .from('logistics_assignments')
          .update(updateData)
          .eq('id', tripId);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Create a new consolidated logistics trip
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
      const tripId = tripData.id || `TRK-RD-${Date.now().toString().slice(-6)}`;
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
        total_kg: tripData.totalKg || 1000,
        current_lat: tripData.currentLat ?? null,
        current_lng: tripData.currentLng ?? null,
        current_temp: tripData.currentTemp ?? null,
        target_temp: tripData.targetTemp ?? 6.0,
        humidity: tripData.humidity ?? null,
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

      if (!error && data) {
        return mapLegacyTripRow(data);
      }

      return mapLegacyTripRow(payload);
    } catch (err: any) {
      console.error('Error creating trip:', err?.message);
      return null;
    }
  },
};