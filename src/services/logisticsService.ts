import { LogisticsFleetVehicle, ConsolidatedTrip } from '@/types/logistics';
import { supabase } from '@/lib/supabase';
import { getCachedOrders } from './consumerService';

function mapRowToConsolidatedTrip(row: any): ConsolidatedTrip {
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
   * Fetch active fleet vehicles live from public.logistics_trips
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
   * Fetch all consolidated trips live from public.logistics_trips, merged with recent consumer orders
   */
  async getTrips(): Promise<ConsolidatedTrip[]> {
    let dbTrips: ConsolidatedTrip[] = [];
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        dbTrips = data.map(mapRowToConsolidatedTrip);
      }
    } catch (err: any) {
      console.warn('Error fetching trips from Supabase:', err?.message);
    }

    // Include recent consumer orders so logistics dashboard reflects active shipments
    const cachedOrders = getCachedOrders();
    const orderTrips: ConsolidatedTrip[] = [];

    for (const ord of cachedOrders) {
      const tripId = ord.logisticsId || `TRK-${ord.id}`;
      if (!dbTrips.some(t => t.id === tripId)) {
        orderTrips.push({
          id: tripId,
          tripCode: `TRIP-${ord.id.slice(-6)}`,
          vehicle: {
            id: `veh-${ord.id.slice(-4)}`,
            vehicleNumber: 'TS 08 UB 4192',
            vehicleType: 'Tata 407 Reefer',
            capacityKg: 3500,
            currentLoadKg: ord.totalQuantityKg || 1000,
            driverName: 'Mohammed Ismail',
            driverPhone: '+91 98480 22341',
            status: 'In Transit',
            reeferActive: true,
            currentLocation: ord.deliveryAddress ? `${ord.deliveryAddress.city} Transit Corridor` : 'Highway Transit',
            assignedTripId: tripId,
          },
          sourceHub: ord.items?.[0]?.product?.location || 'Origin Farm Hub',
          destinationHub: ord.deliveryAddress ? `${ord.deliveryAddress.city} APMC Yard` : 'Central APMC Terminal',
          totalDistanceKm: 85,
          distanceCompletedKm: 15,
          commodity: ord.items?.[0]?.product?.name || 'Farm Harvest',
          totalKg: ord.totalQuantityKg || 1000,
          pickups: [
            {
              fpoName: 'Farmer Cluster Unit',
              location: ord.items?.[0]?.product?.location || 'Farm Hub',
              qtyKg: ord.totalQuantityKg || 1000,
              status: 'Loaded',
            },
          ],
          status: 'IN TRANSIT',
          estimatedArrival: 'En Route',
          spoilageRisk: 'LOW',
        });
      }
    }

    return [...dbTrips, ...orderTrips];
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
        .maybeSingle();

      if (!error && data) {
        return mapRowToConsolidatedTrip(data);
      }
    } catch (err: any) {
      console.warn('Error fetching trip by ID:', err?.message);
    }

    return null;
  },

  /**
   * Create a new consolidated logistics trip in public.logistics_trips
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

      try {
        const { data, error } = await supabase
          .from('logistics_trips')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return mapRowToConsolidatedTrip(data);
        }
      } catch (insertErr: any) {
        console.warn('Supabase trip insert notice:', insertErr?.message);
      }

      return mapRowToConsolidatedTrip(payload);
    } catch (err: any) {
      console.error('Error creating trip:', err?.message);
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
      const updateData: any = {
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString(),
      };
      if (locationName) updateData.current_location = locationName;

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .eq('id', tripId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Update cold-chain telemetry live in public.logistics_trips
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

      const { error } = await supabase
        .from('logistics_trips')
        .update(updateData)
        .eq('id', tripId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Check for any pending dispatch order waiting for a driver to accept
   */
  async getPendingDispatchTrip(): Promise<ConsolidatedTrip | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .eq('status', 'DISPATCH_OFFERED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return mapRowToConsolidatedTrip(data);
      }
    } catch {}

    const cachedOrders = getCachedOrders();
    const pendingOrder = cachedOrders.find(
      (o) => o.status === 'Preparing' || o.status === 'Order Placed' || o.status === 'Confirmed' || o.status === 'Escrow Locked'
    );

    if (pendingOrder) {
      const tripId = pendingOrder.logisticsId || `TRK-${pendingOrder.id}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(`agriflow_accepted_${tripId}`)) {
        return null;
      }

      return {
        id: tripId,
        tripCode: `DISPATCH-${pendingOrder.id.slice(-6)}`,
        vehicle: {
          id: 'veh-candidate',
          vehicleNumber: 'TS 08 UB 4192',
          vehicleType: 'Tata 407 Reefer',
          capacityKg: 3500,
          currentLoadKg: pendingOrder.totalQuantityKg || 1000,
          driverName: 'Mohammed Ismail',
          driverPhone: '+91 98480 22341',
          status: 'Available',
          reeferActive: true,
          currentLocation: 'Nashik / Shamshabad APMC Dock',
          assignedTripId: tripId,
        },
        sourceHub: pendingOrder.items?.[0]?.product?.location || 'Nashik Farm Gate Hub',
        destinationHub: pendingOrder.deliveryAddress
          ? `${pendingOrder.deliveryAddress.city} Central Wholesale Yard`
          : 'Central Wholesale Terminal',
        totalDistanceKm: 74,
        distanceCompletedKm: 0,
        commodity: pendingOrder.items?.[0]?.product?.name || 'Bulk Agricultural Produce',
        totalKg: pendingOrder.totalQuantityKg || 1000,
        pickups: [
          {
            fpoName: 'Farmer Cluster Unit',
            location: pendingOrder.items?.[0]?.product?.location || 'Nashik Farm Hub',
            qtyKg: pendingOrder.totalQuantityKg || 1000,
            status: 'Loaded',
          },
        ],
        status: 'DISPATCH_OFFERED' as any,
        estimatedArrival: '1h 30m',
        spoilageRisk: 'LOW',
      };
    }

    return null;
  },

  /**
   * Driver accepts haul
   */
  async acceptDispatchTrip(tripId: string, driver?: FleetDriverCandidate): Promise<boolean> {
    const selectedDriver = driver || FLEET_DRIVERS_QUEUE[0];
    try {
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
        .eq('id', tripId);

      // Also update linked order in public.orders so farmer and consumer see live status transition
      const orderId = tripId.startsWith('TRK-') ? tripId.replace('TRK-', '') : tripId;
      await supabase
        .from('orders')
        .update({ status: 'IN TRANSIT', updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},logistics_id.eq.${tripId}`);
    } catch (err: any) {
      console.warn('Accept dispatch update notice:', err?.message);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`agriflow_accepted_${tripId}`, 'true');
    }
    return true;
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
};

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