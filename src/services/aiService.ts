import { AIRecommendation, DemandZone, ProducePool } from "@/types/farmer";
import { mockAIRecommendations, mockDemandZones, mockProducePools } from "./mockData/mockForecasts";
import { mockSIHScenario } from "./mockData/sihScenarioData";

export const aiService = {
  getRecommendations(): Promise<AIRecommendation[]> {
    return Promise.resolve(mockAIRecommendations);
  },

  getDemandZones(): Promise<DemandZone[]> {
    return Promise.resolve(mockDemandZones);
  },

  getProducePools(): Promise<ProducePool[]> {
    return Promise.resolve(mockProducePools);
  },

  getSIHScenario() {
    return mockSIHScenario;
  }
};
