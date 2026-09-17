import { AIRecommendation, DemandZone, ProducePool, SIHScenarioData } from "@/types/farmer";
import { apiClient } from "@/lib/apiClient";

export const aiService = {
  async getRecommendations(): Promise<AIRecommendation[]> {
    try {
      return await apiClient<AIRecommendation[]>('/api/farmer/ai-recommendations', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getDemandZones(): Promise<DemandZone[]> {
    try {
      return await apiClient<DemandZone[]>('/api/farmer/demand-zones', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getProducePools(): Promise<ProducePool[]> {
    try {
      return await apiClient<ProducePool[]>('/api/farmer/produce-pools', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getSIHScenario(): Promise<SIHScenarioData | null> {
    try {
      return await apiClient<SIHScenarioData>('/api/farmer/impact-scenario', { method: 'GET' });
    } catch {
      return null;
    }
  }
};