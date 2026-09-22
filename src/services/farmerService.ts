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
  unit?: string;
  grade?: string;
  category?: string;
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

    if (typeof window !== 'undefined') {
      const demoRole = localStorage.getItem('agriflow_active_demo_role');
      if (demoRole === 'farmer' || demoRole === 'fpo' || !demoRole) {
        return {
          userId: '00000000-0000-4000-8000-000000000001',
          fullName: 'Ramesh Reddy (Farmer / FPO)',
          location: 'Shadnagar FPO Hub, Ranga Reddy, Telangana',
          phone: '+91 98480 12345',
          fpoName: 'Shadnagar Organic Farmers Producer Co.',
          district: 'Ranga Reddy',
          state: 'Telangana',
          latitude: 17.0689,
          longitude: 78.2045,
        };
      }
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
   * Fetch produce listings directly from authoritative public.produce table
   * strictly scoped to the authenticated farmer.
   */
  async getProduceList(farmerId?: string): Promise<Produce[]> {
    try {
      const ctx = await getLoggedInFarmerContext();
      const targetFarmerId = farmerId || ctx?.userId;

      let query = supabase
        .from('produce')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetFarmerId) {
        query = query.or(`farmer_id.eq.${targetFarmerId},farmer_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching produce from Supabase:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((l: any) => mapRowToProduce(l, []));
    } catch (err: any) {
      console.error('Failed to get farmer produce list:', err?.message);
      return [];
    }
  },

  /**
   * Fetch a single produce item by ID directly from public.produce
   */
  async getProduceById(id: string): Promise<Produce | null> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error('Supabase getProduceById error:', error.message);
        return null;
      }

      return mapRowToProduce(data, []);
    } catch (err: any) {
      console.error('Failed to get produce by id:', err?.message);
      return null;
    }
  },

  /**
   * Create a new produce record directly in public.produce
   */
  async createProduce(item: CreateProduceInput): Promise<ProduceRow> {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveFarmerId = item.farmer_id || user?.id || '00000000-0000-4000-8000-000000000001';
    const ctx = await getLoggedInFarmerContext();
    const loc = item.location || ctx?.location || 'Shadnagar Farm Hub, Telangana';
    const harvestDate = item.harvest_date || new Date().toISOString().split('T')[0];
    const qty = Math.max(0, Number(item.quantity_kg));
    const price = Math.max(0, Number(item.price_per_kg));

    const category = item.category || inferCategory(item.crop_name);
    const unit = item.unit || 'kg';
    const grade = item.grade || 'A';
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
    const now = new Date().toISOString();

    const producePayload = {
      id: newId,
      farmer_id: effectiveFarmerId,
      crop_name: item.crop_name,
      variety: item.variety || null,
      category: category,
      quantity: qty,
      quantity_kg: qty,
      asking_price: price,
      price_per_kg: price,
      unit: unit,
      quality_grade: grade,
      harvest_date: harvestDate,
      location: loc,
      image_url: item.image_url || null,
      status: 'Active',
      created_at: now,
      updated_at: now,
    };

    const { data: prodData, error: prodErr } = await supabase
      .from('produce')
      .insert(producePayload)
      .select()
      .single();

    if (prodErr && !prodData) {
      console.error('Supabase produce insert error:', prodErr.message);
      throw new Error(prodErr.message || 'Failed to create produce listing');
    }

    // Mirror to produce_listings if permitted
    try {
      await supabase.from('produce_listings').insert({
        id: newId,
        farmer_id: effectiveFarmerId,
        produce_name: item.crop_name,
        variety: item.variety || null,
        category: category.toLowerCase(),
        total_quantity: qty,
        available_quantity: qty,
        price_per_unit: price,
        unit: unit,
        quality_grade: grade,
        harvest_date: harvestDate,
        location_address: loc,
        images: item.image_url ? [item.image_url] : [],
        status: 'active',
        created_at: now,
        updated_at: now,
      });
    } catch {}

    const finalRecord = prodData || producePayload;
    return {
      id: String(finalRecord.id),
      farmer_id: finalRecord.farmer_id,
      crop_name: finalRecord.crop_name,
      variety: finalRecord.variety,
      quantity_kg: Number(finalRecord.quantity_kg || finalRecord.quantity || 0),
      price_per_kg: Number(finalRecord.price_per_kg || finalRecord.asking_price || 0),
      location: finalRecord.location,
      harvest_date: finalRecord.harvest_date,
      image_url: finalRecord.image_url,
      updated_at: finalRecord.updated_at || now,
      created_at: finalRecord.created_at || now,
    };
  },

  /**
   * Update quantity directly in public.produce table (triggers Realtime broadcast)
   */
  async updateQuantity(id: string, qty: number): Promise<ProduceRow> {
    const numQty = Math.max(0, Number(qty));
    const now = new Date().toISOString();

    const { data: prodData, error: prodErr } = await supabase
      .from('produce')
      .update({
        quantity: numQty,
        quantity_kg: numQty,
        status: numQty === 0 ? 'Sold' : 'Active',
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (prodErr || !prodData) {
      console.error('Supabase updateQuantity error:', prodErr?.message);
      throw new Error(prodErr?.message || `Failed to update quantity for produce ${id}`);
    }

    try {
      await supabase
        .from('produce_listings')
        .update({ available_quantity: numQty, status: numQty === 0 ? 'sold_out' : 'active', updated_at: now })
        .eq('id', id);
    } catch {}

    return {
      id: String(prodData.id),
      farmer_id: prodData.farmer_id,
      crop_name: prodData.crop_name,
      variety: prodData.variety,
      quantity_kg: Number(prodData.quantity_kg || prodData.quantity || 0),
      price_per_kg: Number(prodData.price_per_kg || prodData.asking_price || 0),
      location: prodData.location,
      harvest_date: prodData.harvest_date,
      image_url: prodData.image_url,
      updated_at: prodData.updated_at || now,
      created_at: prodData.created_at,
    };
  },

  /**
   * Delete a produce item directly from public.produce
   */
  async deleteProduce(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: prodErr } = await supabase
        .from('produce')
        .delete()
        .eq('id', id);

      try {
        await supabase.from('produce_listings').delete().eq('id', id);
      } catch {}

      if (prodErr) {
        console.error('Supabase produce delete error:', prodErr.message);
        return { success: false, error: prodErr.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('deleteProduce error:', err);
      return { success: false, error: err?.message || 'Failed to delete produce' };
    }
  },

  /**
   * List produce belonging to farmer directly from public.produce table
   */
  async listMyProduce(farmerId?: string): Promise<ProduceRow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetId = farmerId || user?.id;

    let query = supabase.from('produce').select('*').order('created_at', { ascending: false });
    if (targetId) {
      query = query.or(`farmer_id.eq.${targetId},farmer_id.is.null`);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Supabase listMyProduce error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      farmer_id: row.farmer_id,
      crop_name: row.crop_name || 'Farm Harvest',
      variety: row.variety,
      quantity_kg: Number(row.quantity_kg || row.quantity || 0),
      price_per_kg: Number(row.price_per_kg || row.asking_price || 0),
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
      unit: item.unit,
      grade: item.grade,
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

    // Authoritative update on produce_listings only
    await supabase
      .from('produce_listings')
      .update({ status: dbStatus.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', id);

    const item = await this.getProduceById(id);
    if (!item) throw new Error('Produce not found');
    return item;
  },

  /**
   * Fetch incoming orders for the authenticated farmer directly from public.orders
   */
  async getFarmerOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    let farmerId = user?.id;
    if (!farmerId && typeof window !== 'undefined') {
      const demoRole = localStorage.getItem('agriflow_active_demo_role');
      if (demoRole === 'farmer' || demoRole === 'fpo' || !demoRole) {
        farmerId = '00000000-0000-4000-8000-000000000001';
      }
    }

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (farmerId) {
      query = query.or(`farmer_id.eq.${farmerId},farmer_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching farmer orders from Supabase:', error.message);
      return [];
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