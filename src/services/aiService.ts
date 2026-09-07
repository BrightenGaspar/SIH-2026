import { AIRecommendation, DemandZone, ProducePool, SIHScenarioData } from "@/types/farmer";
import { apiClient } from "@/lib/apiClient";
import { mockAIRecommendations, mockDemandZones, mockProducePools } from "./mockData/mockForecasts";
import { mockSIHScenario } from "./mockData/sihScenarioData";

export const aiService = {
  async getRecommendations(): Promise<AIRecommendation[]> {
    try {
      return await apiClient<AIRecommendation[]>('/api/farmer/ai-recommendations', { method: 'GET' });
    } catch {
      return mockAIRecommendations;
    }
  },

  async getDemandZones(): Promise<DemandZone[]> {
    try {
      return await apiClient<DemandZone[]>('/api/farmer/demand-zones', { method: 'GET' });
    } catch {
      return mockDemandZones;
    }
  },

  async getProducePools(): Promise<ProducePool[]> {
    try {
      return await apiClient<ProducePool[]>('/api/farmer/produce-pools', { method: 'GET' });
    } catch {
      return mockProducePools;
    }
  },

  async getSIHScenario(): Promise<SIHScenarioData> {
    try {
      return await apiClient<SIHScenarioData>('/api/farmer/impact-scenario', { method: 'GET' });
    } catch {
      return mockSIHScenario;
    }
  }
};
