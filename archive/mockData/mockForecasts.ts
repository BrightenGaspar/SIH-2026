import { AIRecommendation, DemandZone, ProducePool } from "@/types/farmer";

export const mockDemandZones: DemandZone[] = [
  {
    id: "dz-01",
    region: "Hyderabad Urban Cluster",
    state: "Telangana",
    commodity: "Tomato",
    lat: 17.385044,
    lng: 78.486671,
    demandKg: 5000,
    supplyKg: 3200,
    gapKg: 1800,
    opportunityLevel: "High",
    pricePerKg: 42.00,
    buyerCount: 14,
  },
  {
    id: "dz-02",
    region: "Warangal Commercial Belt",
    state: "Telangana",
    commodity: "Tomato",
    lat: 17.9689,
    lng: 79.5941,
    demandKg: 3000,
    supplyKg: 2800,
    gapKg: 200,
    opportunityLevel: "Moderate",
    pricePerKg: 37.50,
    buyerCount: 6,
  },
  {
    id: "dz-03",
    region: "Bengaluru Agri Terminal",
    state: "Karnataka",
    commodity: "Tomato",
    lat: 12.9716,
    lng: 77.5946,
    demandKg: 8500,
    supplyKg: 9200,
    gapKg: -700,
    opportunityLevel: "Normal",
    pricePerKg: 34.00,
    buyerCount: 22,
  },
  {
    id: "dz-04",
    region: "Vijayawada Retail Consolidation",
    state: "Andhra Pradesh",
    commodity: "Green Chilli",
    lat: 16.5062,
    lng: 80.6480,
    demandKg: 4200,
    supplyKg: 2600,
    gapKg: 1600,
    opportunityLevel: "High",
    pricePerKg: 58.00,
    buyerCount: 9,
  }
];

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: "rec-01",
    title: "Sell Tomato to Hyderabad Wholesale & Institutional Hub",
    actionText: "Dispatch to Hyderabad Bulk Pool",
    score: 91,
    expectedImprovementPerKg: 4.00,
    confidence: 88,
    summary: "High demand deficit of 1,800 kg in Bowenpally corridor. Better realization than local Mandi with consolidated road transport.",
    factors: {
      demandStrength: 92,
      distanceScore: 86,
      freshnessScore: 90,
      expectedPriceScore: 88,
      fairRealizationScore: 94,
    },
    reasoning: [
      "Demand in Hyderabad is 18% above regional supply levels.",
      "Nearby Mandi prices are capped at ₹38/kg vs ₹42/kg buyer direct realization.",
      "Produce Grade A qualifies for zero-rejection fast-track lane.",
      "Consolidating with 3 Shadnagar farmers saves 34% road freight."
    ],
    recommendedMarket: "Bowenpally Institutional Hub, Hyderabad",
    bestTimeToSellDays: 4,
  },
  {
    id: "rec-02",
    title: "Hold Green Chilli inventory for 3 days for price surge",
    actionText: "Schedule Dispatch in 72 hrs",
    score: 84,
    expectedImprovementPerKg: 6.00,
    confidence: 81,
    summary: "Vijayawada terminal supply arriving from North is delayed. Prices projected to jump +₹6.00/kg by Thursday.",
    factors: {
      demandStrength: 85,
      distanceScore: 78,
      freshnessScore: 92,
      expectedPriceScore: 90,
      fairRealizationScore: 82,
    },
    reasoning: [
      "Monsoon logistics bottleneck is slowing incoming shipments from Maharashtra.",
      "Local demand remains steady with institutional buyers bidding actively.",
      "Safe window in farm cold-shed is 120+ hours (Low spoilage risk)."
    ],
    recommendedMarket: "Vijayawada Agri Terminal",
    bestTimeToSellDays: 3,
  }
];

export const mockProducePools: ProducePool[] = [
  {
    id: "pool-hyd-tomato",
    targetCommodity: "Tomato (Hybrid Desi)",
    destination: "Hyderabad Central Food Logistics Hub",
    targetQuantityKg: 5000,
    currentQuantityKg: 5000,
    buyerName: "FreshBaskets & SuperMarket Consortium",
    offeredPricePerKg: 42.00,
    estimatedFreightSavingsPercent: 38,
    participants: [
      { id: "p1", farmerName: "Ramesh Reddy (Your Contribution)", quantityKg: 1200, isCurrentUser: true },
      { id: "p2", farmerName: "Suresh Kumar (FPO Unit B)", quantityKg: 800 },
      { id: "p3", farmerName: "Venkatesh Rao (Chevella Farm)", quantityKg: 1500 },
      { id: "p4", farmerName: "Laxmi Farmer Producer Co.", quantityKg: 1500 },
    ],
    deadline: "2026-09-07T18:00:00Z",
    status: "Consolidating",
  },
  {
    id: "pool-vja-chilli",
    targetCommodity: "Green Chilli (G4)",
    destination: "Vijayawada Commercial Cluster",
    targetQuantityKg: 3000,
    currentQuantityKg: 1800,
    buyerName: "Andhra Spice Exporters & Wholesalers",
    offeredPricePerKg: 58.00,
    estimatedFreightSavingsPercent: 28,
    participants: [
      { id: "p5", farmerName: "Guntur Spice Cluster A", quantityKg: 1000 },
      { id: "p6", farmerName: "Krishna Valley Growers", quantityKg: 800 },
    ],
    deadline: "2026-09-08T12:00:00Z",
    status: "Open",
  }
];
