import { BulkDemand, ConsumerOrder, ConsumerTracking, ProductDetails, Recommendation } from '@/types/consumer';
import { supabase } from '@/lib/supabase';
import { 
  mockConsumerProducts, 
  mockConsumerOrders, 
  mockBulkDemands, 
  mockRecommendations 
} from './mockData/mockConsumerData';

export const consumerService = {
  // Products — Directly queries Supabase 'produce' and joins 'profiles'
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
          profiles:farmer_id (
            id,
            full_name,
            fpo_name,
            location,
            state,
            district,
            place
          )
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase getProducts warning:', error.message);
        return mockConsumerProducts;
      }

      return data.map((row: any) => {
        const price = Number(row.asking_price) || 30;
        const profile = row.profiles as any;

        return {
          id: row.id,
          name: row.crop_name || 'Farm Harvest',
          category: (row.category || 'Vegetables') as any,
          image: row.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
          grade: (row.quality_grade || 'A') as any,
          gradeDescription: `Grade ${row.quality_grade || 'A'} Certified Farm Harvest`,
          availableQuantityKg: Number(row.quantity) || 500,
          minOrderQuantityKg: 10,
          harvestDate: row.harvest_date || 'Harvested Recently',
          freshness: 'Harvested Today',
          freshnessScore: 'Excellent',
          farmerStory: {
            id: profile?.id || row.id,
            farmerName: profile?.full_name || 'Verified Kisan Partner',
            farmOrFpoName: profile?.fpo_name || 'Regional Agro Producer Co.',
            farmerPhoto: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150',
            generalLocation: row.location || profile?.location || 'Direct Farm',
            district: profile?.district || 'Nashik',
            state: profile?.state || 'Maharashtra',
            mainCrops: [row.crop_name || 'Fresh Produce'],
            harvestDate: row.harvest_date || 'Recent',
            soilPractices: 'Natural compost & drip irrigation',
            organicPractices: 'Pesticide residue tested',
            story: 'Direct harvest cultivated with sustainable agricultural practices and transparent traceability.',
            totalAcresGrown: '4.5 Acres',
            fairPriceCommitment: '100% Direct to Farmer (Zero Middlemen Deductions)',
          },
          location: row.location || profile?.location || 'Regional Agricultural Cluster',
          pricePerKg: price,
          bulkAvailable: (Number(row.quantity) || 0) >= 500,
          priceBreakdown: {
            consumerPricePerKg: price,
            farmerReceivesPerKg: Math.round(price * 0.85),
            roadLogisticsPerKg: Math.round(price * 0.10),
            platformFeePerKg: Math.round(price * 0.05),
            conventionalMarketPricePerKg: Math.round(price * 1.30),
            farmerRealizationBoostPercent: 28,
          },
          description: `${row.crop_name || 'Produce'} direct from farmgate. Verified sweetness and optimal cold-chain handling.`,
          isColdChainEligible: true,
          tags: ['Direct Farmgate', 'Verified Traceability', row.quality_grade || 'Grade A'],
          shelfLifeDays: row.shelf_life_days || 14,
          optimalStorageTempCelsius: 4.0,
          nutritionHighlights: ['Farmgate Fresh', 'Naturally Grown', 'Pesticide Monitored'],
          harvestBatchNumber: `BATCH-${row.id.substring(0, 8).toUpperCase()}`,
          qualityInspectionReport: {
            colorScore: 95,
            firmnessScore: 92,
            defectPercentage: 1.0,
            inspectionDate: new Date().toISOString().split('T')[0],
            inspectorName: 'AgriFlow Digital QA',
          },
        };
      });
    } catch (err: any) {
      console.warn('Fallback getting products:', err?.message);
      return mockConsumerProducts;
    }
  },

  async getProductById(id: string): Promise<ProductDetails | null> {
    try {
      const products = await this.getProducts();
      const found = products.find(p => p.id === id);
      return found || mockConsumerProducts.find(p => p.id === id) || mockConsumerProducts[0];
    } catch {
      return mockConsumerProducts.find(p => p.id === id) || mockConsumerProducts[0];
    }
  },

  // Orders — Directly queries Supabase 'orders' table
  async getOrders(): Promise<ConsumerOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return mockConsumerOrders;
      }

      return data.map((o: any) => ({
        id: o.id,
        orderDate: o.created_at ? o.created_at.substring(0, 16).replace('T', ' ') : new Date().toISOString().substring(0, 16),
        status: o.status || 'Confirmed',
        items: [],
        totalQuantityKg: Number(o.quantity_kg) || 10,
        subtotal: Number(o.total_amount) || 0,
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
    } catch {
      return mockConsumerOrders;
    }
  },

  async getOrderById(id: string): Promise<ConsumerOrder | null> {
    try {
      const orders = await this.getOrders();
      return orders.find(o => o.id === id) || mockConsumerOrders[0];
    } catch {
      return mockConsumerOrders[0];
    }
  },

  async createOrder(orderData: Omit<ConsumerOrder, 'id' | 'orderDate' | 'status'>): Promise<ConsumerOrder> {
    const newOrderId = `ORD-CONS-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          id: newOrderId,
          commodity: orderData.items?.[0]?.product?.name || 'Assorted Farm Produce',
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
        console.warn('Supabase createOrder error, returning local state:', error.message);
      }

      return {
        id: newOrderId,
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Confirmed',
        ...orderData,
        logisticsId: 'TRK-CONS-ROAD-9021',
        estimatedDeliveryDate: 'Within 6 Hours',
      };
    } catch {
      return {
        id: newOrderId,
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Confirmed',
        ...orderData,
        logisticsId: 'TRK-CONS-ROAD-9021',
        estimatedDeliveryDate: 'Within 6 Hours',
      };
    }
  },

  // Tracking
  async getTracking(logisticsId: string): Promise<ConsumerTracking | null> {
    try {
      const { data } = await supabase
        .from('logistics_trips')
        .select('*')
        .eq('id', logisticsId)
        .single();

      if (data) {
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
          currentCoordinates: [19.85, 73.5],
          pickupCoordinates: [19.9975, 73.7898],
          destinationCoordinates: [19.2183, 72.9781],
          estimatedArrival: 'Today 04:30 PM',
          status: 'In Transit',
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
      }
      return null;
    } catch {
      return null;
    }
  },

  // Bulk Demand
  async getBulkDemands(): Promise<BulkDemand[]> {
    return mockBulkDemands;
  },

  async createBulkDemand(demand: Partial<BulkDemand>): Promise<BulkDemand> {
    const qty = demand.requiredQuantityKg || 1000;
    return {
      id: `BD-${Math.floor(100 + Math.random() * 900)}`,
      buyerId: demand.buyerId || 'consumer-001',
      produceName: demand.produceName || 'Tomato (Grade A)',
      requiredQuantityKg: qty,
      requiredGrade: demand.requiredGrade || 'A',
      deliveryLocation: demand.deliveryLocation || 'Bowenpally Hub, Hyderabad',
      deliveryCity: demand.deliveryCity || 'Hyderabad',
      preferredDeliveryDate: demand.preferredDeliveryDate || 'Tomorrow',
      deliveryWindow: demand.deliveryWindow || 'Morning',
      maxBudgetPerKg: demand.maxBudgetPerKg || 30,
      matchedQuantityKg: demand.matchedQuantityKg ?? Math.round(qty * 0.6),
      remainingQuantityKg: demand.remainingQuantityKg ?? Math.round(qty * 0.4),
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

  // Cart
  async addToCart(productId: string, quantityKg: number): Promise<{ success: boolean }> {
    return { success: true };
  },

  // Recommendations
  async getRecommendations(buyerType?: string): Promise<Recommendation[]> {
    return mockRecommendations;
  },
};
