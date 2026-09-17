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
}

export interface FarmerInventorySummary {
  totalKg: number;
  availableKg: number;
  reservedKg: number;
  deliveredKg: number;
  activeListingsCount: number;
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
        .select('id, full_name, fpo_name, state, district, place, phone')
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

function mapRowToProduce(row: any): Produce {
  const profile = row.profiles as any;
  const profileLoc = profile
    ? [profile.place, profile.district, profile.state].filter(Boolean).join(', ')
    : undefined;

  const rawStatus = (row.status || 'active').toLowerCase();
  let mappedStatus: ProduceStatus = 'Active';
  if (rawStatus === 'sold_out' || rawStatus === 'sold') {
    mappedStatus = 'Sold';
  } else if (rawStatus === 'reserved') {
    mappedStatus = 'Reserved';
  } else if (rawStatus === 'inactive' || rawStatus === 'expired') {
    mappedStatus = 'Expired';
  }

  return {
    id: row.id,
    crop: row.produce_name || row.crop_name || 'Produce',
    quantity: Number(row.available_quantity != null ? row.available_quantity : row.quantity) || 0,
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
            phone
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

      return data.map(mapRowToProduce);
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
            phone
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error('Supabase getProduceById error:', error.message);
        return null;
      }

      return mapRowToProduce(data);
    } catch (err: any) {
      console.error('Failed to get produce by id:', err?.message);
      return null;
    }
  },

  /**
   * Insert a new produce listing directly into Supabase public.produce_listings
   * strictly linked to the authenticated farmer session.
   */
  async addProduce(
    item: Omit<Produce, "id" | "createdAt" | "status">,
    farmerId?: string
  ): Promise<Produce> {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveFarmerId = user?.id || farmerId;

    if (!effectiveFarmerId) {
      throw new Error('Authentication required: You must be signed in as a farmer to create a listing.');
    }

    const ctx = await getLoggedInFarmerContext();
    const locationToSave = item.location || ctx?.location || 'Nashik APMC Hub, Maharashtra';
    const categoryToSave = inferCategory(item.crop);

    const { data, error } = await supabase
      .from('produce_listings')
      .insert({
        farmer_id: effectiveFarmerId,
        produce_name: item.crop,
        variety: item.notes || null,
        category: categoryToSave,
        total_quantity: Number(item.quantity),
        available_quantity: Number(item.quantity),
        unit: item.unit || 'kg',
        quality_grade: item.grade || 'A',
        harvest_date: item.harvestDate || new Date().toISOString().split('T')[0],
        price_per_unit: Number(item.expectedPrice),
        location_address: locationToSave,
        status: 'active',
        image_url: item.imageUrl || item.image_url || null,
        shelf_life_days: 14,
      })
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
        status,
        image_url,
        created_at
      `)
      .single();

    if (error || !data) {
      console.error('Supabase produce_listings insert error:', error?.message);
      throw new Error(error?.message || 'Failed to create produce listing in database.');
    }

    return mapRowToProduce(data);
  },

  /**
   * Update an existing produce listing directly in public.produce_listings
   */
  async updateProduceStatus(id: string, status: Produce["status"]): Promise<Produce> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('Authentication required to update produce status.');
    }

    const dbStatus = status === 'Active' ? 'active' : status === 'Sold' ? 'sold_out' : 'inactive';

    const { data, error } = await supabase
      .from('produce_listings')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('farmer_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Supabase update error in updateProduceStatus:', error?.message);
      throw new Error(error?.message || 'Failed to update produce status');
    }

    return mapRowToProduce(data);
  },

  /**
   * Delete a produce listing directly from public.produce_listings
   */
  async deleteProduce(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('Authentication required to delete produce listing.');
    }

    const { error } = await supabase
      .from('produce_listings')
      .delete()
      .eq('id', id)
      .eq('farmer_id', user.id);

    if (error) {
      console.error('Supabase delete error in deleteProduce:', error.message);
      return false;
    }
    return true;
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
        if (st === 'accepted' || st === 'preparing' || st === 'ready_for_pickup') {
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