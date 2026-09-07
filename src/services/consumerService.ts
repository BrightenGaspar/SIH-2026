import { BulkDemand, ConsumerOrder, ConsumerTracking, ProductDetails, Recommendation } from '@/types/consumer';
import { apiClient } from '@/lib/apiClient';

export const consumerService = {
  // Products
  async getProducts(): Promise<ProductDetails[]> {
    return apiClient<ProductDetails[]>('/api/consumer/products', { method: 'GET' });
  },

  async getProductById(id: string): Promise<ProductDetails | null> {
    return apiClient<ProductDetails>(`/api/consumer/products/${id}`, { method: 'GET' });
  },

  // Orders
  async getOrders(): Promise<ConsumerOrder[]> {
    return apiClient<ConsumerOrder[]>('/api/consumer/orders', { method: 'GET' });
  },

  async getOrderById(id: string): Promise<ConsumerOrder | null> {
    return apiClient<ConsumerOrder>(`/api/consumer/orders/${id}`, { method: 'GET' });
  },

  async createOrder(orderData: Omit<ConsumerOrder, 'id' | 'orderDate' | 'status'>): Promise<ConsumerOrder> {
    return apiClient<ConsumerOrder>('/api/consumer/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Tracking
  async getTracking(logisticsId: string): Promise<ConsumerTracking | null> {
    return apiClient<ConsumerTracking>(`/api/consumer/tracking/${logisticsId}`, { method: 'GET' });
  },

  // Bulk Demand
  async getBulkDemands(): Promise<BulkDemand[]> {
    return apiClient<BulkDemand[]>('/api/consumer/bulk-demands', { method: 'GET' });
  },

  async createBulkDemand(demand: Omit<BulkDemand, 'id' | 'createdAt' | 'status' | 'matchedSupplyKg' | 'matchedPoolsCount'>): Promise<BulkDemand> {
    return apiClient<BulkDemand>('/api/consumer/bulk-demands', {
      method: 'POST',
      body: JSON.stringify(demand),
    });
  },

  // Recommendations
  async getRecommendations(buyerType?: string): Promise<Recommendation[]> {
    return apiClient<Recommendation[]>('/api/consumer/recommendations', {
      method: 'GET',
      params: buyerType ? { buyerType } : undefined,
    });
  },
};