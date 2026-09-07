import { BulkDemand, ConsumerOrder, ConsumerTracking, ProductDetails, Recommendation } from '@/types/consumer';
import { apiClient } from '@/lib/apiClient';
import { 
  mockConsumerProducts, 
  mockConsumerOrders, 
  mockBulkDemands, 
  mockRecommendations 
} from './mockData/mockConsumerData';

export const consumerService = {
  // Products
  async getProducts(): Promise<ProductDetails[]> {
    try {
      return await apiClient<ProductDetails[]>('/api/consumer/products', { method: 'GET' });
    } catch {
      return mockConsumerProducts;
    }
  },

  async getProductById(id: string): Promise<ProductDetails | null> {
    try {
      return await apiClient<ProductDetails>(`/api/consumer/products/${id}`, { method: 'GET' });
    } catch {
      return mockConsumerProducts.find(p => p.id === id) || mockConsumerProducts[0];
    }
  },

  // Orders
  async getOrders(): Promise<ConsumerOrder[]> {
    try {
      return await apiClient<ConsumerOrder[]>('/api/consumer/orders', { method: 'GET' });
    } catch {
      return mockConsumerOrders;
    }
  },

  async getOrderById(id: string): Promise<ConsumerOrder | null> {
    try {
      return await apiClient<ConsumerOrder>(`/api/consumer/orders/${id}`, { method: 'GET' });
    } catch {
      return mockConsumerOrders.find(o => o.id === id) || mockConsumerOrders[0];
    }
  },

  async createOrder(orderData: Omit<ConsumerOrder, 'id' | 'orderDate' | 'status'>): Promise<ConsumerOrder> {
    try {
      return await apiClient<ConsumerOrder>('/api/consumer/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    } catch {
      const newOrder: ConsumerOrder = {
        id: `ORD-CONS-${Math.floor(1000 + Math.random() * 9000)}`,
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Confirmed',
        ...orderData,
        logisticsId: 'TRK-CONS-ROAD-9021',
        estimatedDeliveryDate: 'Within 6 Hours',
      };
      return newOrder;
    }
  },

  // Tracking
  async getTracking(logisticsId: string): Promise<ConsumerTracking | null> {
    try {
      return await apiClient<ConsumerTracking>(`/api/consumer/tracking/${logisticsId}`, { method: 'GET' });
    } catch {
      return null;
    }
  },

  // Bulk Demand
  async getBulkDemands(): Promise<BulkDemand[]> {
    try {
      return await apiClient<BulkDemand[]>('/api/consumer/bulk-demands', { method: 'GET' });
    } catch {
      return mockBulkDemands;
    }
  },

  async createBulkDemand(demand: Partial<BulkDemand>): Promise<BulkDemand> {
    try {
      return await apiClient<BulkDemand>('/api/consumer/bulk-demands', {
        method: 'POST',
        body: JSON.stringify(demand),
      });
    } catch {
      const qty = demand.requiredQuantityKg || 1000;
      const newDemand: BulkDemand = {
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
      return newDemand;
    }
  },

  // Recommendations
  async getRecommendations(buyerType?: string): Promise<Recommendation[]> {
    try {
      return await apiClient<Recommendation[]>('/api/consumer/recommendations', {
        method: 'GET',
        params: buyerType ? { buyerType } : undefined,
      });
    } catch {
      return mockRecommendations;
    }
  },
};
