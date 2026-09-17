import { Produce, ProduceGrade, ProduceStatus, Order, OrderStatus } from "@/types/farmer";
import { supabase } from "@/lib/supabase";

export interface FarmerProfileContext {
  userId?: string;
  fullName?: string;
  location?: string;
  phone?: string;
  fpoName?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface FarmerInventorySummary {
  totalKg: number;
  availableKg: number;
  reservedKg: number;
  deliveredKg: number;
  activeListingsCount: number;
}
export interface CreateProduceInput {
  farmer_id?: string;
  crop_name: string;
  variety?: string;
  quantity_kg: number;
  price_per_kg: number;
  location?: string;
  harvest_date?: string;
  image_url?: string;
}

export interface ProduceRow {
  id: string;
  farmer_id?: string | null;
  crop_name: string;
  variety?: string | null;
  quantity_kg: number;
  price_per_kg: number;
  location?: string | null;
  harvest_date?: string | null;
  image_url?: string | null;
  updated_at?: string;
  created_at?: string;
}

/**
 * Retrieve the active logged-in farmer profile context from Supabase Auth
 */
export async function getLoggedInFarmerContext(): Promise<FarmerProfileContext | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, fpo_name, state, district, place, phone, latitude, longitude')
        .eq('id', user.id)
        .maybeSingle();

      const loc = profile
        ? [profile.place, profile.district, profile.state].filter(Boolean).join(', ')
        : undefined;

      return {
        userId: user.id,
        fullName: profile?.full_name || (user.user_metadata?.full_name as string) || user.email,
        location: loc,
        phone: profile?.phone,
        fpoName: profile?.fpo_name,
        district: profile?.district,
        state: profile?.state,
        latitude: profile?.latitude != null ? Number(profile.latitude) : undefined,
        longitude: profile?.longitude != null ? Number(profile.longitude) : undefined,
      };
    }
  } catch (err) {
    console.warn('Error resolving logged-in farmer context:', err);
  }
  return null;
}

function inferCategory(cropName: string): 'vegetables' | 'fruits' | 'grains' | 'spices' {
  const lower = cropName.toLowerCase();
  if (
    lower.includes('mango') ||
    lower.includes('apple') ||
    lower.includes('banana') ||
    lower.includes('orange') ||
    lower.includes('grape') ||
    lower.includes('papaya') ||
    lower.includes('guava') ||
    lower.includes('pomegranate') ||
    lower.includes('citrus')
  ) {
    return 'fruits';
  }
  if (
    lower.includes('rice') ||
    lower.includes('wheat') ||
    lower.includes('maize') ||
    lower.includes('millet') ||
    lower.includes('barley') ||
    lower.includes('corn') ||
    lower.includes('paddy')
  ) {
    return 'grains';
  }
  if (
    lower.includes('chilli') ||
    lower.includes('pepper') ||
    lower.includes('turmeric') ||
    lower.includes('cardamom') ||
    lower.includes('ginger') ||
    lower.includes('garlic') ||
    lower.includes('cumin') ||
    lower.includes('coriander')
  ) {
    return 'spices';
  }
  return 'vegetables';
}

function mapRowToProduce(row: any, relatedOrders: any[] = []): Produce {
  const profile = row.profiles as any;
  const profileLoc = profile
    ? [profile.place, profile.district, profile.state].filter(Boolean).join(', ')
    : undefined;

  const rawStatus = (row.status || 'active').toLowerCase();
  const availableKg = Number(row.available_quantity != null ? row.available_quantity : row.quantity) || 0;

  // Compute live reserved & delivered quantities from authoritative orders ledger
  let reservedKg = 0;
  let deliveredKg = 0;

  if (relatedOrders && relatedOrders.length > 0) {
    for (const o of relatedOrders) {
      const qty = Number(o.quantity != null ? o.quantity : o.quantity_kg) || 0;
      const st = (o.status || '').toLowerCase();
      if (['pending', 'accepted', 'preparing', 'ready_for_pickup', 'pickup_assigned', 'in_transit'].includes(st)) {
        reservedKg += qty;
      } else if (st === 'delivered') {
        deliveredKg += qty;
      }
    }
  }

  const totalKg = Number(row.total_quantity) || (availableKg + reservedKg + deliveredKg);

  let mappedStatus: ProduceStatus = 'Active';
  if (availableKg <= 0 && reservedKg === 0) {
    mappedStatus = 'Sold';
  } else if (availableKg <= 0 && reservedKg > 0) {
    mappedStatus = 'Reserved';
  } else if (rawStatus === 'sold_out' || rawStatus === 'sold') {
    mappedStatus = 'Sold';
  } else if (rawStatus === 'reserved') {
    mappedStatus = 'Reserved';
  } else if (rawStatus === 'inactive' || rawStatus === 'expired') {
    mappedStatus = 'Expired';
  }

  return {
    id: row.id,
    crop: row.produce_name || row.crop_name || 'Produce',
    quantity: availableKg,
    totalQuantity: totalKg,
    availableQuantity: availableKg,
    reservedQuantity: reservedKg,
    deliveredQuantity: deliveredKg,
    locationLat: row.location_lat != null ? Number(row.location_lat) : (profile?.latitude != null ? Number(profile.latitude) : undefined),
    locationLng: row.location_lng != null ? Number(row.location_lng) : (profile?.longitude != null ? Number(profile.longitude) : undefined),
    unit: row.unit || 'kg',
    grade: (row.quality_grade as ProduceGrade) || 'A',
    harvestDate: row.harvest_date || new Date().toISOString().split('T')[0],
    expectedPrice: Number(row.price_per_unit || row.asking_price) || 0,
    location: row.location_address || row.location || profileLoc || 'Farm Location',
    status: mappedStatus,
    notes: row.variety ? `${row.variety}${row.category ? ` • ${row.category}` : ''}` : undefined,
    imageUrl: row.image_url,
    image_url: row.image_url,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const farmerService = {
  /**
   * Fetch produce listings directly from authoritative public.produce_listings table
   * strictly scoped to the authenticated farmer (auth.uid()).
   */
  async getProduceList(farmerId?: string): Promise<Produce[]> {
    try {
      const ctx = await getLoggedInFarmerContext();
      const targetFarmerId = farmerId || ctx?.userId;

      let query = supabase
        .from('produce_listings')
        .select(`
          id,
          farmer_id,
          produce_name,
          variety,
          category,
          total_quantity,
          available_quantity,
          price_per_unit,
          unit,
          harvest_date,
          quality_grade,
          location_address,
          location_lat,
          location_lng,
          status,
          image_url,
          created_at,
          profiles:farmer_id (
            id,
            full_name,
            fpo_name,
            state,
            district,
            place,
            phone,
            latitude,
            longitude
          )
        `)
        .order('created_at', { ascending: false });

      if (targetFarmerId) {
        query = query.eq('farmer_id', targetFarmerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching produce listings from Supabase:', error.message);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        return [];
      }

      const listingIds = data.map((l) => l.id);
      const { data: orders } = await supabase
        .from('orders')
        .select('id, listing_id, quantity, quantity_kg, status')
        .in('listing_id', listingIds);

      return data.map((l) => {
        const related = (orders || []).filter((o) => o.listing_id === l.id);
        return mapRowToProduce(l, related);
      });
    } catch (err: any) {
      console.error('Failed to get farmer produce list:', err?.message);
      throw err;
    }
  },

  /**
   * Fetch a single produce item by ID directly from public.produce_listings
   */
  async getProduceById(id: string): Promise<Produce | null> {
    try {
      const { data, error } = await supabase
        .from('produce_listings')
        .select(`
          id,
          farmer_id,
          produce_name,
          variety,
          category,
          total_quantity,
          available_quantity,
          price_per_unit,
          unit,
          harvest_date,
          quality_grade,
          location_address,
          location_lat,
          location_lng,
          status,
          image_url,
          created_at,
          profiles:farmer_id (
            id,
            full_name,
            fpo_name,
            state,
            district,
            place,
            phone,
            latitude,
            longitude
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error('Supabase getProduceById error:', error.message);
        return null;
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, listing_id, quantity, quantity_kg, status')
        .eq('listing_id', id);

      return mapRowToProduce(data, orders || []);
    } catch (err: any) {
      console.error('Failed to get produce by id:', err?.message);
      return null;
    }
  },

  /**
  /**
   * Create a new produce record directly in public.produce
   */
  async createProduce(item: CreateProduceInput): Promise<ProduceRow> {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveFarmerId = item.farmer_id || user?.id || null;
    const ctx = await getLoggedInFarmerContext();
    const loc = item.location || ctx?.location || 'Nashik APMC Hub, Maharashtra';
    const harvestDate = item.harvest_date || new Date().toISOString().split('T')[0];
    const qty = Math.max(0, Number(item.quantity_kg));
    const price = Math.max(0, Number(item.price_per_kg));

    const insertPayload: any = {
      farmer_id: effectiveFarmerId,
      crop_name: item.crop_name,
      variety: item.variety || null,
      quantity_kg: qty,
      quantity: qty, // legacy column fallback
      price_per_kg: price,
      asking_price: price, // legacy column fallback
      location: loc,
      harvest_date: harvestDate,
      image_url: item.image_url || null,
      status: 'Active',
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('produce')
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
      delete insertPayload.quantity_kg;
      delete insertPayload.price_per_kg;
      delete insertPayload.updated_at;
      const retry = await supabase.from('produce').insert(insertPayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error('Supabase produce insert error:', error?.message);
      throw new Error(error?.message || 'Failed to create produce listing');
    }

    return {
      id: String(data.id),
      farmer_id: data.farmer_id,
      crop_name: data.crop_name,
      variety: data.variety,
      quantity_kg: data.quantity_kg != null ? Number(data.quantity_kg) : Number(data.quantity || 0),
      price_per_kg: data.price_per_kg != null ? Number(data.price_per_kg) : Number(data.asking_price || 0),
      location: data.location,
      harvest_date: data.harvest_date,
      image_url: data.image_url,
      updated_at: data.updated_at || data.created_at || new Date().toISOString(),
      created_at: data.created_at,
    };
  },

  /**
   * Update quantity directly in public.produce table (triggers Realtime broadcast)
   */
  async updateQuantity(id: string, qty: number): Promise<ProduceRow> {
    const numQty = Math.max(0, Number(qty));
    const now = new Date().toISOString();

    let { data, error } = await supabase
      .from('produce')
      .update({
        quantity_kg: numQty,
        quantity: numQty, // legacy column compatibility
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
      const retry = await supabase
        .from('produce')
        .update({ quantity: numQty })
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error('Supabase updateQuantity error:', error?.message);
      throw new Error(error?.message || `Failed to update quantity for produce ${id}`);
    }

    // Also sync to produce_listings if present for secondary views
    try {
      await supabase
        .from('produce_listings')
        .update({ available_quantity: numQty, updated_at: now })
        .eq('id', id);
    } catch {
      // optional sync
    }

    return {
      id: String(data.id),
      farmer_id: data.farmer_id,
      crop_name: data.crop_name,
      variety: data.variety,
      quantity_kg: data.quantity_kg != null ? Number(data.quantity_kg) : Number(data.quantity || 0),
      price_per_kg: data.price_per_kg != null ? Number(data.price_per_kg) : Number(data.asking_price || 0),
      location: data.location,
      harvest_date: data.harvest_date,
      image_url: data.image_url,
      updated_at: data.updated_at || data.created_at || now,
      created_at: data.created_at,
    };
  },

  /**
   * Delete a produce item directly from public.produce
   */
  async deleteProduce(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('produce')
      .delete()
      .eq('id', id);

    // Also try delete from produce_listings
    try {
      await supabase.from('produce_listings').delete().eq('id', id);
    } catch {
      // ignore
    }

    if (error) {
      console.error('Supabase produce delete error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * List produce belonging to farmer directly from public.produce
   */
  async listMyProduce(farmerId?: string): Promise<ProduceRow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetId = farmerId || user?.id;

    let query = supabase.from('produce').select('*');
    if (targetId) {
      query = query.eq('farmer_id', targetId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase listMyProduce error:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      farmer_id: row.farmer_id,
      crop_name: row.crop_name || 'Farm Harvest',
      variety: row.variety,
      quantity_kg: row.quantity_kg != null ? Number(row.quantity_kg) : Number(row.quantity || 0),
      price_per_kg: row.price_per_kg != null ? Number(row.price_per_kg) : Number(row.asking_price || 0),
      location: row.location,
      harvest_date: row.harvest_date,
      image_url: row.image_url,
      updated_at: row.updated_at || row.created_at || new Date().toISOString(),
      created_at: row.created_at,
    }));
  },

  /**
   * Insert a new produce listing directly into Supabase public.produce
   * strictly linked to the authenticated farmer session.
   */
  async addProduce(
    item: Omit<Produce, "id" | "createdAt" | "status">,
    farmerId?: string
  ): Promise<Produce> {
    const created = await this.createProduce({
      farmer_id: farmerId,
      crop_name: item.crop,
      variety: item.notes,
      quantity_kg: Number(item.quantity),
      price_per_kg: Number(item.expectedPrice),
      location: item.location,
      harvest_date: item.harvestDate,
      image_url: item.imageUrl || item.image_url,
    });

    return {
      id: created.id,
      crop: created.crop_name,
      quantity: created.quantity_kg,
      totalQuantity: created.quantity_kg,
      availableQuantity: created.quantity_kg,
      reservedQuantity: 0,
      deliveredQuantity: 0,
      unit: item.unit || 'kg',
      grade: item.grade || 'A',
      harvestDate: created.harvest_date || new Date().toISOString().split('T')[0],
      expectedPrice: created.price_per_kg,
      location: created.location || 'Local Hub',
      status: (created.quantity_kg > 0 ? 'Active' : 'Sold') as ProduceStatus,
      imageUrl: created.image_url || undefined,
      notes: created.variety || undefined,
      createdAt: created.created_at || new Date().toISOString(),
    };
  },

  /**
   * Update an existing produce listing status
   */
  async updateProduceStatus(id: string, status: Produce["status"]): Promise<Produce> {
    const dbStatus = status === 'Active' ? 'Active' : status === 'Sold' ? 'Sold' : 'Inactive';

    await supabase
      .from('produce')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    try {
      await supabase
        .from('produce_listings')
        .update({ status: dbStatus.toLowerCase(), updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // ignore
    }

    const item = await this.getProduceById(id);
    if (!item) throw new Error('Produce not found');
    return item;
  },

  /**
   * Fetch incoming orders for the authenticated farmer directly from public.orders
   */
  async getFarmerOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        listing_id,
        commodity,
        quantity,
        quantity_kg,
        unit_price,
        total_amount,
        farmer_realization,
        status,
        delivery_address,
        payment_status,
        created_at,
        customer_id,
        buyer_id,
        profiles:customer_id (
          id,
          full_name,
          phone,
          place,
          area
        )
      `)
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farmer orders from Supabase:', error.message);
      throw new Error(error.message);
    }

    if (!data) return [];

    return data.map((o: any): Order => {
      const profile = o.profiles as any;
      const buyerName = profile?.full_name || 'AgriFlow Verified Buyer';
      const quantityKg = Number(o.quantity || o.quantity_kg || 0);
      const totalValue = Number(o.farmer_realization || o.total_amount || 0);

      let canonicalStatus: OrderStatus = 'New';
      const rawStatus = (o.status || 'pending').toLowerCase();

      if (rawStatus === 'pending') canonicalStatus = 'New';
      else if (rawStatus === 'accepted') canonicalStatus = 'Confirmed';
      else if (rawStatus === 'preparing') canonicalStatus = 'Preparing';
      else if (rawStatus === 'ready_for_pickup') canonicalStatus = 'Ready to Deliver';
      else if (rawStatus === 'in_transit' || rawStatus === 'dispatched') canonicalStatus = 'In Transit';
      else if (rawStatus === 'delivered') canonicalStatus = 'Delivered';
      else if (rawStatus === 'rejected') canonicalStatus = 'Rejected';
      else if (rawStatus === 'cancelled') canonicalStatus = 'Cancelled';

      return {
        id: o.id,
        buyerName,
        buyerType: 'Direct Commercial Buyer',
        produceName: o.commodity || 'Farm Harvest',
        quantityKg,
        grade: 'A',
        pricePerKg: quantityKg > 0 ? Math.round(totalValue / quantityKg) : Number(o.unit_price) || 30,
        totalOrderValue: totalValue,
        orderDate: o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        pickupDate: 'Scheduled for Pickup',
        deliveryDate: o.created_at,
        status: canonicalStatus,
        rawStatus: rawStatus,
        logisticsId: `TRK-${o.id}`,
        destinationCity: o.delivery_address || 'Regional Distribution Hub',
        buyerId: o.customer_id || o.buyer_id,
      };
    });
  },

  /**
   * Transition order lifecycle state using the authoritative database RPC:
   * farmer_update_order_status(p_order_id, p_new_status)
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('Authentication required to transition order status.');
    }

    let targetDbStatus = newStatus.toLowerCase();
    if (newStatus === 'READY_TO_DELIVER' || newStatus === 'Ready to Deliver') {
      targetDbStatus = 'ready_for_pickup';
    } else if (newStatus === 'PREPARING' || newStatus === 'Preparing') {
      targetDbStatus = 'preparing';
    } else if (newStatus === 'Confirmed' || newStatus === 'accepted' || newStatus === 'ACCEPTED') {
      targetDbStatus = 'accepted';
    } else if (newStatus === 'Rejected' || newStatus === 'rejected' || newStatus === 'REJECTED') {
      targetDbStatus = 'rejected';
    }

    const { data, error } = await supabase.rpc('farmer_update_order_status', {
      p_order_id: orderId,
      p_new_status: targetDbStatus,
    });

    if (error) {
      console.error('farmer_update_order_status RPC error:', error.message);
      throw new Error(error.message);
    }

    return (data?.success === true);
  },

  /**
   * Compute live inventory metrics directly from database state (zero client-side math)
   */
  async getInventorySummary(): Promise<FarmerInventorySummary> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return { totalKg: 0, availableKg: 0, reservedKg: 0, deliveredKg: 0, activeListingsCount: 0 };
    }

    const [listingsRes, ordersRes] = await Promise.all([
      supabase
        .from('produce_listings')
        .select('total_quantity, available_quantity, status')
        .eq('farmer_id', user.id),
      supabase
        .from('orders')
        .select('quantity, quantity_kg, status')
        .eq('farmer_id', user.id),
    ]);

    let totalKg = 0;
    let availableKg = 0;
    let activeListingsCount = 0;

    if (listingsRes.data) {
      for (const l of listingsRes.data) {
        totalKg += Number(l.total_quantity) || 0;
        availableKg += Number(l.available_quantity) || 0;
        if (l.status === 'active') activeListingsCount++;
      }
    }

    let reservedKg = 0;
    let deliveredKg = 0;

    if (ordersRes.data) {
      for (const o of ordersRes.data) {
        const qty = Number(o.quantity || o.quantity_kg || 0);
        const st = (o.status || '').toLowerCase();
        if (['pending', 'accepted', 'preparing', 'ready_for_pickup', 'pickup_assigned', 'in_transit'].includes(st)) {
          reservedKg += qty;
        } else if (st === 'delivered') {
          deliveredKg += qty;
        }
      }
    }

    return {
      totalKg,
      availableKg,
      reservedKg,
      deliveredKg,
      activeListingsCount,
    };
  },
};

export const createProduce = farmerService.createProduce.bind(farmerService);
export const updateQuantity = farmerService.updateQuantity.bind(farmerService);
export const deleteProduce = farmerService.deleteProduce.bind(farmerService);
export const listMyProduce = farmerService.listMyProduce.bind(farmerService);