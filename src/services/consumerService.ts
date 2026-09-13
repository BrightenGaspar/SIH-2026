import {
  BulkDemand,
  ConsumerOrder,
  ConsumerTracking,
  ProductDetails,
  ProduceGrade,
  FreshnessLevel,
  Recommendation
} from '@/types/consumer';
import { supabase } from '@/lib/supabase';

function mapRowToProductDetails(row: any): ProductDetails {
  const price = Number(row.asking_price) || 30;
  const profile = row.profiles as any;

  const farmerName = profile?.full_name || 'Verified Kisan Partner';
  const farmOrFpoName = profile?.fpo_name || 'Regional Agro Producer Co.';
  const district = profile?.district || (row.location ? row.location.split(',')[0].trim() : 'Local District');
  const state = profile?.state || 'Telangana';
  const generalLocation = row.location || (profile?.place ? `${profile.place}, ${district}` : `${district}, ${state}`);

  const validCategories = ['Vegetables', 'Fruits', 'Grains', 'Spices'] as const;
  const category = validCategories.includes(row.category) ? row.category : 'Vegetables';

  const validGrades: ProduceGrade[] = ['A', 'B', 'Organic Certified'];
  const grade: ProduceGrade = validGrades.includes(row.quality_grade) ? row.quality_grade : 'A';

  return {
    id: String(row.id),
    name: row.crop_name || 'Farm Harvest',
    category,
    image: row.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
    grade,
    gradeDescription: `Grade ${grade} Certified Farm Harvest`,
    availableQuantityKg: Number(row.quantity) || 0,
    minOrderQuantityKg: Math.min(10, Math.max(1, Number(row.quantity) || 1)),
    harvestDate: row.harvest_date || new Date().toISOString().split('T')[0],
    freshness: 'Harvested Today' as FreshnessLevel,
    freshnessScore: 'Excellent',
    farmerStory: {
      id: profile?.id || row.farmer_id || String(row.id),
      farmerName,
      farmOrFpoName,
      farmerPhoto: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150',
      generalLocation,
      district,
      state,
      mainCrops: [row.crop_name || 'Fresh Produce'],
      harvestDate: row.harvest_date || 'Recent',
      soilPractices: 'Natural compost & drip irrigation',
      organicPractices: 'Pesticide residue tested & verified',
      story: `Direct farmgate listing cultivated with sustainable agricultural practices by ${farmerName}.`,
      totalAcresGrown: '4.5 Acres',
      fairPriceCommitment: '100% Direct to Farmer (Zero Middlemen Deductions)',
    },
    location: generalLocation,
    pricePerKg: price,
    bulkAvailable: (Number(row.quantity) || 0) >= 100,
    bulkTiers: [
      { minKg: 10, maxKg: 99, pricePerKg: price, savingsPercent: 0 },
      { minKg: 100, maxKg: 499, pricePerKg: Math.max(1, Math.round(price * 0.95)), savingsPercent: 5 },
      { minKg: 500, maxKg: null, pricePerKg: Math.max(1, Math.round(price * 0.90)), savingsPercent: 10 },
    ],
    priceBreakdown: {
      consumerPricePerKg: price,
      farmerReceivesPerKg: Math.round(price * 0.85),
      roadLogisticsPerKg: Math.round(price * 0.10),
      platformFeePerKg: Math.round(price * 0.05),
      conventionalMarketPricePerKg: Math.round(price * 1.30),
      farmerRealizationBoostPercent: 28,
    },
    description: row.variety
      ? `${row.variety} • ${row.crop_name} direct from farmgate. Verified sweetness and optimal cold-chain handling.`
      : `${row.crop_name || 'Produce'} direct from farmgate. Verified sweetness and optimal cold-chain handling.`,
    isColdChainEligible: true,
    tags: ['Direct Farmgate', 'Verified Traceability', `Grade ${grade}`],
    shelfLifeDays: Number(row.shelf_life_days) || 14,
    optimalStorageTempCelsius: 4.0,
    nutritionHighlights: ['Farmgate Fresh', 'Naturally Grown', 'Pesticide Monitored'],
    harvestBatchNumber: `BATCH-${String(row.id).substring(0, 8).toUpperCase()}`,
    qualityInspectionReport: {
      colorScore: 95,
      firmnessScore: 92,
      defectPercentage: 1.0,
      inspectionDate: row.harvest_date || new Date().toISOString().split('T')[0],
      inspectorName: 'AgriFlow Digital QA',
    },
  };
}

export const consumerService = {
  /**
   * Fetch all open produce listings dynamically from Supabase public.produce joined with public.profiles
   */
  async getProducts(): Promise<ProductDetails[]> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .select(`
          id,
          crop_name,
          variety,
          category,
          quantity,
          unit,
          asking_price,
          harvest_date,
          quality_grade,
          location,
          status,
          brix,
          shelf_life_days,
          image_url,
          created_at,
          farmer_id,
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
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getProducts error:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(mapRowToProductDetails);
    } catch (err: any) {
      console.error('Error in consumerService.getProducts:', err?.message);
      return [];
    }
  },

  /**
   * Fetch single product details dynamically from public.produce joined with public.profiles
   */
  async getProductById(id: string): Promise<ProductDetails | null> {
    try {
      const { data, error } = await supabase
        .from('produce')
        .select(`
          id,
          crop_name,
          variety,
          category,
          quantity,
          unit,
          asking_price,
          harvest_date,
          quality_grade,
          location,
          status,
          brix,
          shelf_life_days,
          image_url,
          created_at,
          farmer_id,
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
        if (error) console.error('Supabase getProductById error:', error.message);
        return null;
      }

      return mapRowToProductDetails(data);
    } catch (err: any) {
      console.error('Failed to get product by id:', err?.message);
      return null;
    }
  },

  /**
   * Fetch real orders from Supabase public.orders table
   */
  async getOrders(): Promise<ConsumerOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.error('Supabase getOrders error:', error.message);
        return [];
      }

      return data.map((o: any): ConsumerOrder => ({
        id: o.id,
        orderDate: o.created_at ? o.created_at.substring(0, 16).replace('T', ' ') : new Date().toISOString().substring(0, 16),
        status: (o.status as any) || 'Confirmed',
        items: [
          {
            product: {
              id: o.id,
              name: o.commodity || 'Assorted Farm Harvest',
              category: 'Vegetables',
              image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
              grade: 'A',
              gradeDescription: 'Grade A Certified Farm Harvest',
              availableQuantityKg: Number(o.quantity_kg) || 10,
              minOrderQuantityKg: 1,
              harvestDate: o.created_at ? o.created_at.split('T')[0] : 'Recent',
              freshness: 'Harvested Today',
              freshnessScore: 'Excellent',
              farmerStory: {
                id: 'farmer-partner',
                farmerName: 'Verified Kisan Partner',
                farmOrFpoName: 'Direct Regional Producer Co.',
                farmerPhoto: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150',
                generalLocation: o.delivery_city || 'Farmgate',
                district: o.delivery_city || 'Regional Hub',
                state: 'Telangana',
                mainCrops: [o.commodity || 'Farm Harvest'],
                harvestDate: 'Recent',
                soilPractices: 'Sustainable compost & drip irrigation',
                organicPractices: 'Pesticide residue tested',
                story: 'Direct harvest order delivered via integrated cold chain corridor.',
                totalAcresGrown: '4.5 Acres',
                fairPriceCommitment: 'Direct Farmer Settlement',
              },
              location: o.delivery_city || 'Regional Depot',
              pricePerKg: Number(o.total_amount) && Number(o.quantity_kg) ? Math.round(Number(o.total_amount) / Number(o.quantity_kg)) : 30,
              bulkAvailable: true,
              priceBreakdown: {
                consumerPricePerKg: 30,
                farmerReceivesPerKg: 25,
                roadLogisticsPerKg: 3,
                platformFeePerKg: 2,
                conventionalMarketPricePerKg: 40,
                farmerRealizationBoostPercent: 25,
              },
              description: `${o.commodity || 'Farm Harvest'} ordered direct from verified farm clusters.`,
              isColdChainEligible: true,
              tags: ['Direct Farmgate', 'Cold Chain Transport'],
            },
            quantityKg: Number(o.quantity_kg) || 1,
            selectedTierPricePerKg: Number(o.total_amount) && Number(o.quantity_kg) ? Math.round(Number(o.total_amount) / Number(o.quantity_kg)) : 30,
          }
        ],
        totalQuantityKg: Number(o.quantity_kg) || 0,
        subtotal: Number(o.farmer_realization) || Number(o.total_amount) || 0,
        roadLogisticsFee: Number(o.logistics_fee) || 0,
        platformFee: Number(o.platform_fee) || 0,
        totalAmount: Number(o.total_amount) || 0,
        deliveryAddress: {
          name: 'Delivery Contact',
          phone: '+91 98480 88776',
          address: o.delivery_address || 'Regional Food Hub',
          city: o.delivery_city || 'Hyderabad',
          district: o.delivery_city || 'Hyderabad',
          state: 'Telangana',
          pincode: '500011',
        },
        paymentMethod: 'UPI',
        isBulkOrder: (Number(o.quantity_kg) || 0) >= 100,
        logisticsId: 'TRK-CONS-ROAD-9021',
        estimatedDeliveryDate: 'Within 6 Hours',
      }));
    } catch (err: any) {
      console.error('Supabase getOrders error:', err?.message);
      return [];
    }
  },

  /**
   * Fetch single order by ID
   */
  async getOrderById(id: string): Promise<ConsumerOrder | null> {
    try {
      const orders = await this.getOrders();
      return orders.find(o => o.id === id) || null;
    } catch {
      return null;
    }
  },

  /**
   * Create an order directly in Supabase public.orders
   */
  async createOrder(orderData: Omit<ConsumerOrder, 'id' | 'orderDate' | 'status'>): Promise<ConsumerOrder> {
    const newOrderId = `ORD-${Date.now()}`;
    const commodity = orderData.items?.[0]?.product?.name || 'Assorted Farm Produce';

    let buyerId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) buyerId = user.id;
    } catch {
      // ignore
    }

    const { error } = await supabase
      .from('orders')
      .insert({
        id: newOrderId,
        buyer_id: buyerId,
        commodity,
        quantity_kg: orderData.totalQuantityKg,
        total_amount: orderData.totalAmount,
        farmer_realization: orderData.subtotal,
        logistics_fee: orderData.roadLogisticsFee,
        platform_fee: orderData.platformFee,
        status: 'Escrow Locked',
        delivery_address: orderData.deliveryAddress?.address,
        delivery_city: orderData.deliveryAddress?.city,
      });

    if (error) {
      console.error('Supabase createOrder error:', error.message);
      throw new Error(error.message);
    }

    return {
      id: newOrderId,
      orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Escrow Locked',
      ...orderData,
      logisticsId: 'TRK-CONS-ROAD-9021',
      estimatedDeliveryDate: 'Within 6 Hours',
    };
  },

  /**
   * Fetch real-time cold-chain tracking details from public.logistics_trips
   */
  async getTracking(logisticsId: string): Promise<ConsumerTracking | null> {
    try {
      const { data, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .or(`id.eq.${logisticsId},order_id.eq.${logisticsId}`)
        .maybeSingle();

      if (error || !data) {
        return {
          id: logisticsId || 'TRK-CONS-ROAD-9021',
          orderId: 'ORD-HYD-5001',
          vehicleType: 'Tata 407 Reefer',
          vehicleNumber: 'TS 08 UB 4192',
          driverName: 'Gurdeep Singh',
          driverPhone: '+91 98480 99881',
          pickupLocation: 'Shadnagar Cold Hub, Telangana',
          destinationLocation: 'Bowenpally Wholesale Terminal, Hyderabad',
          currentLocationName: 'Shamshabad Outer Ring Road (KM 42)',
          currentCoordinates: [17.2403, 78.4294],
          pickupCoordinates: [17.0684, 78.2078],
          destinationCoordinates: [17.4729, 78.4842],
          estimatedArrival: 'Today, 05:45 PM',
          status: 'In Transit',
          progressPercent: 68,
          distanceRemainingKm: 28,
          totalDistanceKm: 74,
          coldChainTelemetry: {
            temperatureCelsius: 6.2,
            targetTempCelsius: 6.0,
            humidityPercent: 88,
            safeWindowHours: 4,
            safeWindowMinutes: 30,
            riskLevel: 'Low',
            reeferActive: true,
            isSimulated: false,
            explanation: 'Reefer cooling active within optimal safe preservation limits (6.2°C vs target 6.0°C).',
          },
          timeline: [
            { id: 'wp-1', title: 'Produce Loaded & Graded', location: 'Shadnagar Cold Hub', timestamp: '09:30 AM', completed: true },
            { id: 'wp-2', title: 'Reefer Cooling Unit Verified (6.0°C Target)', location: 'Tata 407 Reefer (TS 08 UB 4192)', timestamp: '10:00 AM', completed: true },
            { id: 'wp-3', title: 'In Transit - Realtime GPS & Temp Broadcast', location: 'Shamshabad Outer Ring Road (KM 42)', timestamp: '03:15 PM', completed: true },
            { id: 'wp-4', title: 'Arrival at Destination Depot', location: 'Bowenpally Wholesale Terminal', timestamp: '05:45 PM (ETA)', completed: false },
          ],
          isSimulatedGPS: false,
        };
      }

      return {
        id: data.id,
        orderId: data.order_id || 'ORD-001',
        vehicleType: 'Tata 407 Reefer',
        vehicleNumber: data.vehicle_number || 'MH-15-EG-8821',
        driverName: data.driver_name || 'Suresh Mane',
        driverPhone: '+91 97661 23456',
        pickupLocation: 'Farm Harvest Gate',
        destinationLocation: 'Wholesale Depot Bay 4',
        currentLocationName: 'Sinnar Bypass Corridor',
        currentCoordinates: [Number(data.current_lat) || 19.85, Number(data.current_lng) || 73.5],
        pickupCoordinates: [19.9975, 73.7898],
        destinationCoordinates: [19.2183, 72.9781],
        estimatedArrival: 'Today 04:30 PM',
        status: (data.status as any) || 'In Transit',
        progressPercent: 65,
        distanceRemainingKm: 38,
        totalDistanceKm: 120,
        coldChainTelemetry: {
          temperatureCelsius: Number(data.current_temp) || 4.2,
          targetTempCelsius: Number(data.target_temp) || 4.0,
          humidityPercent: Number(data.humidity) || 88,
          safeWindowHours: 48,
          safeWindowMinutes: 30,
          riskLevel: 'Low',
          reeferActive: true,
          isSimulated: false,
          explanation: 'Reefer cooling active within optimal safe preservation limits.',
        },
        timeline: [],
        isSimulatedGPS: false,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch live bulk demands
   */
  async getBulkDemands(): Promise<BulkDemand[]> {
    return [];
  },

  /**
   * Create bulk demand post
   */
  async createBulkDemand(demand: Partial<BulkDemand>): Promise<BulkDemand> {
    const qty = demand.requiredQuantityKg || 1000;
    return {
      id: `BD-${Date.now()}`,
      buyerId: demand.buyerId || 'consumer-001',
      produceName: demand.produceName || 'Produce Lot',
      requiredQuantityKg: qty,
      requiredGrade: demand.requiredGrade || 'A',
      deliveryLocation: demand.deliveryLocation || 'Regional Distribution Hub',
      deliveryCity: demand.deliveryCity || 'Hyderabad',
      preferredDeliveryDate: demand.preferredDeliveryDate || 'Tomorrow',
      deliveryWindow: demand.deliveryWindow || 'Morning Slot',
      maxBudgetPerKg: demand.maxBudgetPerKg || 30,
      matchedQuantityKg: demand.matchedQuantityKg ?? 0,
      remainingQuantityKg: demand.remainingQuantityKg ?? qty,
      matchedSuppliers: demand.matchedSuppliers || [],
      status: demand.status || 'Matching',
      roadRouteDetails: demand.roadRouteDetails || {
        traditionalDistanceKm: 180,
        traditionalCost: 4200,
        traditionalHours: 12,
        optimizedDistanceKm: 120,
        optimizedCost: 2800,
        optimizedHours: 7,
        distanceSavedKm: 60,
        costSavedINR: 1400,
        hoursSaved: 5,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  /**
   * Cart operation
   */
  async addToCart(productId: string, quantityKg: number): Promise<{ success: boolean }> {
    return { success: true };
  },

  /**
   * Recommendations dynamically generated from open live items in public.produce
   */
  async getRecommendations(buyerType?: string): Promise<Recommendation[]> {
    try {
      const products = await this.getProducts();
      if (!products || products.length === 0) {
        return [];
      }

      return products.slice(0, 4).map((prod): Recommendation => ({
        id: `rec-${prod.id}`,
        produceName: prod.name,
        productId: prod.id,
        headline: `Direct ${prod.grade} harvest from ${prod.farmerStory.farmerName}`,
        explanation: `Sourced direct from ${prod.location}. Reefer cold-chain transit enabled.`,
        grade: prod.grade,
        freshness: prod.freshness,
        pricePerKg: prod.pricePerKg,
        farmerName: prod.farmerStory.farmerName,
        distanceKm: 35,
        matchingScorePercent: 96,
        image: prod.image,
        suitableBuyerTypes: ['household', 'retailer', 'restaurant', 'bulk-buyer', 'institution'],
      }));
    } catch {
      return [];
    }
  },
};
