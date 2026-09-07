import { Order, RoadLogisticsTracking } from "@/types/farmer";
import { apiClient } from "@/lib/apiClient";
import { mockOrders, mockTrackingDetails } from "./mockData/mockOrders";

export const trackingService = {
  async getOrders(): Promise<Order[]> {
    try {
      return await apiClient<Order[]>('/api/farmer/orders', { method: 'GET' });
    } catch {
      return mockOrders;
    }
  },

  async getTrackingDetails(logisticsId: string): Promise<RoadLogisticsTracking | null> {
    try {
      return await apiClient<RoadLogisticsTracking>(`/api/farmer/tracking/${logisticsId}`, { method: 'GET' });
    } catch {
      return mockTrackingDetails[logisticsId] || mockTrackingDetails["TRK-RD-9021"] || null;
    }
  }
};
