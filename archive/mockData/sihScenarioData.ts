import { SIHScenarioData } from "@/types/farmer";

export const mockSIHScenario: SIHScenarioData = {
  commodity: "Tomato (Hybrid Desi)",
  buyerLocation: "Bowenpally Wholesale & Direct Buyer Hub, Hyderabad",
  targetDemandKg: 5000,
  conventionalPrice: 36.00,
  agriflowRealization: 42.00,
  improvementPerKg: 6.00,
  percentageImprovement: 16.67,
  totalAdditionalRealization: 21000,
  traditionalRoute: {
    distanceKm: 312,
    cost: 8400,
    hours: 29,
  },
  optimizedRoute: {
    distanceKm: 187,
    cost: 5200,
    hours: 18,
  },
};
