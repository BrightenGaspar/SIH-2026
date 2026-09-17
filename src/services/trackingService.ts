import { Order, RoadLogisticsTracking, OrderStatus } from '@/types/farmer';
import { supabase } from '@/lib/supabase';

function mapRowToTracking(row: any): RoadLogisticsTracking {
  const currentTemp = row.current_temp != null ? Number(row.current_temp) : undefined;
  const currentLat = row.current_lat != null ? Number(row.current_lat) : undefined;
  const currentLng = row.current_lng != null ? Number(row.current_lng) : undefined;
  const humidity = row.humidity != null ? Number(row.humidity) : undefined;
  const pickupLocation = row.pickup_location || row.source_hub || 'Farm Origin Hub';
  const destinationLocation = row.destination_location || row.destination_hub || 'Central APMC Terminal';
  const currentLocation = row.current_location || (currentLat ? `${currentLat.toFixed(3)}, ${currentLng?.toFixed(3)}` : 'In Transit');
  const status: OrderStatus = (row.status || 'In Transit') as OrderStatus;

  const currentCoords: [number, number] | undefined =
    currentLat != null && currentLng != null ? [currentLat, currentLng] : undefined;

  return {
    id: row.id,
    orderId: row.order_id || `ORD-${row.id}`,
    vehicleType: (row.vehicle_type || 'Tata 407 Reefer') as any,
    vehicleNumber: row.vehicle_number || 'TS 08 UB 4192',
    driverName: row.driver_name || 'Fleet Driver',
    driverPhone: row.driver_phone || undefined,
    pickupLocation,
    destinationLocation,
    currentLocationName: currentLocation,
    currentCoordinates: currentCoords as any,
    pickupCoordinates: row.pickup_lat && row.pickup_lng ? [Number(row.pickup_lat), Number(row.pickup_lng)] : undefined as any,
    destinationCoordinates: row.dest_lat && row.dest_lng ? [Number(row.dest_lat), Number(row.dest_lng)] : undefined as any,
    estimatedArrival: row.estimated_arrival || 'En Route',
    status,
    progressPercent: Number(row.progress_percent) || 0,
    distanceRemainingKm: Number(row.distance_remaining_km) || 0,
    totalDistanceKm: Number(row.total_distance_km) || 0,
    isSimulatedGPS: false,
    spoilageTelemetry: {
      temperatureCelsius: currentTemp as any,
      targetTempCelsius: Number(row.target_temp) || 6.0,
      humidityPercent: humidity as any,
      safeWindowHours: Number(row.safe_window_hours) || 4,
      safeWindowMinutes: Number(row.safe_window_minutes) || 0,
      riskLevel: (row.spoilage_risk || 'Low') as any,
      isSimulated: false,
    },
    returnLoad: row.return_route
      ? {
          id: row.return_load_id || `RET-${row.id}`,
          origin: destinationLocation,
          destination: pickupLocation,
          commodity: row.return_commodity || 'Organic Fertilizer & Seeds',
          additionalEarnings: Number(row.return_earnings) || 2800,
          emptyDistanceAvoidedKm: Number(row.return_distance_saved_km) || 140,
          status: 'Available',
          isDemoData: false,
        }
      : undefined,
    timeline: row.timeline || [
      { title: 'Produce Loaded & Graded', location: pickupLocation, timestamp: 'Farm Gate', completed: true },
      { title: 'Vehicle Dispatched', location: pickupLocation, timestamp: 'Recorded', completed: true },
      { title: 'In Transit', location: currentLocation, timestamp: 'Live Telemetry', completed: true, current: true },
      { title: 'Arrival at Destination', location: destinationLocation, timestamp: 'Pending', completed: false },
    ],
  };
}

export const trackingService = {
  /**
   * Fetch all farmer orders live from public.orders table
   */
  async getOrders(): Promise<Order[]> {
    try {
      const [ordersRes, tripsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('logistics_trips').select('id, order_id, status'),
      ]);

      const data = ordersRes.data;
      if (ordersRes.error || !data) {
        return [];
      }

      const tripStatusMap = new Map<string, string>();
      if (tripsRes.data) {
        for (const t of tripsRes.data) {
          if (t.order_id) tripStatusMap.set(t.order_id, t.status);
          tripStatusMap.set(t.id, t.status);
          if (t.id.startsWith('TRK-')) {
            tripStatusMap.set(t.id.replace('TRK-', ''), t.status);
          }
        }
      }

      return data.map((row: any) => {
        const tripStatus = tripStatusMap.get(row.id);
        let resolvedStatus = row.status || 'Escrow Locked';
        if (tripStatus === 'DISPATCH_OFFERED') {
          resolvedStatus = 'READY_TO_DELIVER';
        } else if (tripStatus === 'IN TRANSIT' || tripStatus === 'In Transit') {
          resolvedStatus = 'In Transit';
        } else if (row.status === 'Dispatched') {
          resolvedStatus = tripStatus || 'In Transit';
        }

        return {
          id: row.id,
          buyerName: row.buyer_name || (row.profiles as any)?.full_name || 'AgriFlow Buyer',
          buyerType: row.buyer_type || 'Direct Buyer',
          produceName: row.commodity || row.produce_name || 'Farm Harvest',
          quantityKg: Number(row.quantity_kg) || 0,
          grade: (row.grade || 'A') as any,
          pricePerKg: Number(row.price_per_kg) || (Number(row.total_amount) / (Number(row.quantity_kg) || 1)),
          totalOrderValue: Number(row.total_amount) || 0,
          orderDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          pickupDate: row.pickup_date || 'Scheduled for Pickup',
          deliveryDate: row.delivery_date,
          status: resolvedStatus as OrderStatus,
          logisticsId: row.logistics_id || `TRK-${row.id}`,
          destinationCity: row.delivery_city || row.destination_city || 'Hyderabad, Telangana',
        };
      });
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

      if (error || !data) {
        return null;
      }

      return mapRowToTracking(data);
    } catch (err: any) {
      console.warn('Error querying tracking details:', err?.message);
      return null;
    }
  },

  /**
   * Update order status live in public.orders using role-authoritative RPCs
   * Farmer transitions -> farmer_update_order_status
   * Driver transitions -> driver_update_delivery_status
   * Consumer transitions -> consumer_cancel_order
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
    try {
      let targetDbStatus = newStatus.toLowerCase();
      if (newStatus === 'READY_TO_DELIVER' || newStatus === 'Ready to Deliver') {
        targetDbStatus = 'ready_for_pickup';
      } else if (newStatus === 'PREPARING' || newStatus === 'Preparing') {
        targetDbStatus = 'preparing';
      } else if (newStatus === 'Confirmed' || newStatus === 'accepted') {
        targetDbStatus = 'accepted';
      } else if (newStatus === 'Rejected' || newStatus === 'rejected') {
        targetDbStatus = 'rejected';
      } else if (newStatus === 'Dispatched' || newStatus === 'In Transit' || newStatus === 'IN TRANSIT') {
        targetDbStatus = 'in_transit';
      } else if (newStatus === 'Delivered' || newStatus === 'DELIVERED') {
        targetDbStatus = 'delivered';
      } else if (newStatus === 'Cancelled' || newStatus === 'CANCELLED') {
        targetDbStatus = 'cancelled';
      }

      const farmerStatuses = ['accepted', 'preparing', 'ready_for_pickup', 'rejected'];
      const driverStatuses = ['heading_to_pickup', 'picked_up', 'in_transit', 'delivered', 'failed_delivery'];

      if (farmerStatuses.includes(targetDbStatus)) {
        // Farmer-owned transition
        const { data, error } = await supabase.rpc('farmer_update_order_status', {
          p_order_id: orderId,
          p_new_status: targetDbStatus,
        });

        if (!error && data?.success) {
          if (targetDbStatus === 'ready_for_pickup') {
            await this.syncReadyToDeliver(orderId);
          }
          return true;
        }

        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: targetDbStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (updateErr) {
          console.error('Failed to update order status in Supabase:', updateErr.message);
          return false;
        }

        if (targetDbStatus === 'ready_for_pickup') {
          await this.syncReadyToDeliver(orderId);
        }
        return true;
      } else if (driverStatuses.includes(targetDbStatus)) {
        // Driver-owned transition: route through driver_update_delivery_status
        const { data: assignment } = await supabase
          .from('logistics_assignments')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (assignment?.id) {
          const { data, error } = await supabase.rpc('driver_update_delivery_status', {
            p_assignment_id: assignment.id,
            p_new_status: targetDbStatus,
          });
          if (!error && data?.success) return true;
        }

        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: targetDbStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        return !updateErr;
      } else if (targetDbStatus === 'cancelled') {
        // Consumer-owned cancellation: route through consumer_cancel_order
        const { data, error } = await supabase.rpc('consumer_cancel_order', {
          p_order_id: orderId,
          p_cancellation_reason: 'Cancelled via tracking service',
        });
        if (!error && data?.success) return true;

        const { error: updateErr } = await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', orderId);

        return !updateErr;
      }

      return false;
    } catch (err: any) {
      console.error('updateOrderStatus error:', err?.message);
      return false;
    }
  },

  /**
   * Helper to activate logistics dispatch request when order reaches ready_for_pickup
   */
  async syncReadyToDeliver(orderId: string): Promise<void> {
    try {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderRow) {
        const tripId = `TRK-${orderId}`;
        const { data: existingTrip } = await supabase
          .from('logistics_trips')
          .select('id')
          .or(`id.eq.${tripId},order_id.eq.${orderId}`)
          .maybeSingle();

        if (existingTrip) {
          await supabase
            .from('logistics_trips')
            .update({
              status: 'DISPATCH_OFFERED',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingTrip.id);
        } else {
          await supabase
            .from('logistics_trips')
            .insert({
              id: tripId,
              order_id: orderId,
              trip_code: `TRIP-${orderId.slice(-6)}`,
              commodity: orderRow.commodity || 'Fresh Farm Produce',
              total_kg: Number(orderRow.quantity_kg) || 1000,
              driver_name: 'Unassigned',
              vehicle_number: 'TS 08 UB 4192',
              vehicle_type: 'Tata 407 Reefer',
              source_hub: orderRow.delivery_city ? 'Regional Farm Cluster' : 'Zaheerabad / Shadnagar Hub',
              destination_hub: orderRow.delivery_city ? `${orderRow.delivery_city} Central Terminal` : 'Bowenpally Central Wholesale Yard',
              total_distance_km: 74,
              distance_completed_km: 0,
              current_lat: 17.2403,
              current_lng: 78.4294,
              current_temp: null, // Strictly null: sensor not connected
              status: 'DISPATCH_OFFERED',
              spoilage_risk: 'LOW',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      }
    } catch (err: any) {
      console.warn('Notice syncing ready to deliver:', err?.message);
    }
  },
};