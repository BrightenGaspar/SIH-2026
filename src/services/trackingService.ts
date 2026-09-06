import { Order, RoadLogisticsTracking } from "@/types/farmer";
import { mockOrders, mockTrackingDetails } from "./mockData/mockOrders";

export const trackingService = {
  getOrders(): Promise<Order[]> {
    return Promise.resolve(mockOrders);
  },

  getTrackingDetails(logisticsId: string): Promise<RoadLogisticsTracking | null> {
    const data = mockTrackingDetails[logisticsId] || null;
    return Promise.resolve(data);
  }
};
