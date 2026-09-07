import { DeliveryTracking } from '@/types/delivery';
import { apiClient, createLiveTrackingSocket } from '@/lib/apiClient';

export const sharedTrackingService = {
  /**
   * Fetch live trip from real backend by tracking ID or Trip ID
   */
  async getTracking(id: string): Promise<DeliveryTracking | null> {
    return apiClient<DeliveryTracking>(`/api/tracking/${id}`, { method: 'GET' });
  },

  /**
   * Fetch trip by Order ID
   */
  async getTrackingByOrderId(orderId: string): Promise<DeliveryTracking | null> {
    return apiClient<DeliveryTracking>(`/api/tracking/order/${orderId}`, { method: 'GET' });
  },

  /**
   * Subscribe to live real-time updates via WebSocket
   */
  subscribe(tripId: string, onUpdate: (trip: DeliveryTracking) => void, onError?: (err: Event) => void): () => void {
    return createLiveTrackingSocket<DeliveryTracking>(tripId, onUpdate, onError);
  },
};
