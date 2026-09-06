export type ProduceGrade = 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-' | 'D';
export type ProduceStatus = 'Active' | 'Reserved' | 'Sold' | 'Expired';
export type OrderStatus = 'New' | 'Confirmed' | 'Pickup' | 'In Transit' | 'Delivered';
export type OpportunityLevel = 'High' | 'Medium' | 'Moderate' | 'Normal';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'farmer';
  location: string;
  farmName: string;
  farmerType?: 'Individual Farmer' | 'FPO' | 'Farmer Group';
  farmSize?: string;
  primaryCrops?: string[];
  createdAt: string;
}

export interface Produce {
  id: string;
  crop: string;
  quantity: number;
  unit: string;
  grade: ProduceGrade;
  harvestDate: string;
  expectedPrice: number;
  location: string;
  status: ProduceStatus;
  notes?: string;
  createdAt: string;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  marketName: string;
  district: string;
  state: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  percentageChange: number;
  bulkBuyerOpportunityPrice: number;
  date: string;
}

export interface PriceTrendPoint {
  day: string;
  currentMandi: number;
  forecastedPrice: number;
  buyerDemandPrice: number;
}

export interface DemandZone {
  id: string;
  region: string;
  state: string;
  commodity: string;
  lat: number;
  lng: number;
  demandKg: number;
  supplyKg: number;
  gapKg: number;
  opportunityLevel: OpportunityLevel;
  pricePerKg: number;
  buyerCount: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  actionText: string;
  score: number;
  expectedImprovementPerKg: number;
  confidence: number;
  summary: string;
  factors: {
    demandStrength: number;
    distanceScore: number;
    freshnessScore: number;
    expectedPriceScore: number;
    fairRealizationScore: number;
  };
  reasoning: string[];
  recommendedMarket: string;
  bestTimeToSellDays: number;
}

export interface ProducePool {
  id: string;
  targetCommodity: string;
  destination: string;
  targetQuantityKg: number;
  currentQuantityKg: number;
  buyerName: string;
  offeredPricePerKg: number;
  estimatedFreightSavingsPercent: number;
  participants: {
    id: string;
    farmerName: string;
    quantityKg: number;
    isCurrentUser?: boolean;
  }[];
  deadline: string;
  status: 'Open' | 'Consolidating' | 'Dispatched' | 'Fulfilled';
}

export interface SpoilageTelemetry {
  temperatureCelsius: number;
  targetTempCelsius: number;
  humidityPercent: number;
  safeWindowHours: number;
  safeWindowMinutes: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  isSimulated: boolean;
}

export interface ReturnLoadOpportunity {
  id: string;
  origin: string;
  destination: string;
  commodity: string;
  additionalEarnings: number;
  emptyDistanceAvoidedKm: number;
  status: 'Available' | 'Assigned';
  isDemoData: boolean;
}

export interface RoadWayPoint {
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface RoadLogisticsTracking {
  id: string;
  orderId: string;
  vehicleType: 'Tata Ace' | 'Tata 407 Reefer' | 'Mahindra Bolero Maxi Truck';
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  pickupLocation: string;
  destinationLocation: string;
  currentLocationName: string;
  currentCoordinates: [number, number];
  pickupCoordinates: [number, number];
  destinationCoordinates: [number, number];
  estimatedArrival: string;
  status: OrderStatus;
  progressPercent: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  spoilageTelemetry: SpoilageTelemetry;
  returnLoad?: ReturnLoadOpportunity;
  timeline: RoadWayPoint[];
  isSimulatedGPS: boolean;
}

export interface Order {
  id: string;
  buyerName: string;
  buyerType: string;
  produceName: string;
  quantityKg: number;
  grade: ProduceGrade;
  pricePerKg: number;
  totalOrderValue: number;
  orderDate: string;
  pickupDate: string;
  deliveryDate?: string;
  status: OrderStatus;
  logisticsId: string;
  destinationCity: string;
}

export interface QualityGradeResult {
  grade: ProduceGrade;
  defectLevel: 'Low' | 'Medium' | 'High';
  visualQualityScore: number;
  colorScore: number;
  sizeConsistencyScore: number;
  surfaceDefectsScore: number;
  damageScore: number;
  freshnessScore: number;
  estimatedFairRealizationMin: number;
  estimatedFairRealizationMax: number;
  explanation: string;
  disclaimer: string;
}

export interface SIHScenarioData {
  commodity: string;
  buyerLocation: string;
  targetDemandKg: number;
  conventionalPrice: number;
  agriflowRealization: number;
  improvementPerKg: number;
  percentageImprovement: number;
  totalAdditionalRealization: number;
  traditionalRoute: {
    distanceKm: number;
    cost: number;
    hours: number;
  };
  optimizedRoute: {
    distanceKm: number;
    cost: number;
    hours: number;
  };
}
