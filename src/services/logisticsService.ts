import { LogisticsFleetVehicle, ConsolidatedTrip } from '@/types/logistics';
import { apiClient } from '@/lib/apiClient';

export const logisticsService = {
  async getFleet(): Promise<LogisticsFleetVehicle[]> {
    try {
      return await apiClient<LogisticsFleetVehicle[]>('/api/logistics/fleet', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getTrips(): Promise<ConsolidatedTrip[]> {
    try {
      return await apiClient<ConsolidatedTrip[]>('/api/logistics/trips', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getTripById(id: string): Promise<ConsolidatedTrip | null> {
    try {
      return await apiClient<ConsolidatedTrip>(`/api/logistics/trips/${id}`, { method: 'GET' });
    } catch {
      return null;
    }
  },

  async acceptReturnLoad(tripId: string, returnLoadId: string): Promise<boolean> {
    try {
      await apiClient(`/api/logistics/trips/${tripId}/return-load`, {
        method: 'POST',
        body: JSON.stringify({ returnLoadId }),
      });
      return true;
    } catch {
      return false;
    }
  }
};