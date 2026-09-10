export type ProduceQualityGrade = 'Grade A' | 'Grade B' | 'Grade C';
export type DemandTrend = 'BULLISH' | 'BEARISH' | 'STABLE';
export type SellStoreAction = 'SELL_NOW' | 'STORE' | 'WAIT' | 'REDIRECT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RescueChannelType = 'DIRECT_BUYER' | 'FOOD_PROCESSOR' | 'COLD_STORAGE' | 'NEIGHBOR_MANDI' | 'FOOD_RESCUE_NGO';

export interface PricingInput {
  commodity: string;
  expectedQuantityKg: number;
  marketableQuantityKg: number;
  totalProductionCost: number;
  recoveryCost?: number;
  transportCost?: number;
  baseMarketPrice: number;
  qualityGrade?: ProduceQualityGrade;
  regionalDemandKg?: number;
  isPeakSeason?: boolean;
  priceElasticity?: number;
  maxConfiguredPrice?: number;
}

export interface PricingResult {
  commodity: string;
  productionCostPerKg: number;
  minimumSustainablePrice: number; // Cost + recovery + transport / marketable qty
  costBasedPrice: number;
  marketPrice: number;
  fairReferencePrice: number; // 0.4 * costBased + 0.6 * market
  qualityAdjustedPrice: number;
  predictedSellingPrice: number;
  recommendedSellingRange: {
    min: number;
    max: number;
    recommended: number;
  };
  factors: {
    costWeight: number;
    marketWeight: number;
    desiredMargin: number;
    qualityFactor: number;
    demandFactor: number;
    seasonFactor: number;
  };
  isLossRisk: boolean;
  explanation: string;
}

export interface WeatherShockInput {
  commodity: string;
  expectedHarvestKg: number;
  damagedHarvestKg: number;
  expectedMarketDemandKg: number;
  baseMarketPrice: number;
  priceElasticity?: number;
  maxConfiguredPrice?: number;
  totalProductionCost?: number;
  recoveryCost?: number;
  transportCost?: number;
  weatherEventType?: 'Excessive Rainfall' | 'Cyclone / Hail' | 'Heatwave' | 'Drought' | 'Frost';
}

export interface WeatherShockResult {
  commodity: string;
  weatherEventType: string;
  expectedHarvestKg: number;
  damagedHarvestKg: number;
  damageRatePercent: number; // Damaged / expected * 100
  marketableSupplyKg: number; // Expected - damaged
  expectedMarketDemandKg: number;
  supplyDemandRatio: number; // Marketable / Demand
  marketShortagePercent: number; // max(0, (Demand - Supply)/Demand * 100)
  priceElasticity: number;
  shockMultiplier: number; // 1 + max(0, 1 - ratio) * elasticity
  baseMarketPrice: number;
  unclampedPredictedPrice: number; // base * shockMultiplier
  safetyClampedPredictedPrice: number; // min(unclamped, maxClamp)
  isClamped: boolean;
  maxConfiguredPrice: number;
  minimumSustainablePrice: number;
  recommendedSellingRange: {
    min: number;
    max: number;
    optimal: number;
  };
  financialImpact: {
    grossRevenueOnMarketableCrop: number;
    totalCostsIncurred: number;
    netProfitOnMarketableCrop: number;
    revenueLostFromDestroyedCrop: number;
    netBalanceVersusNormal: number;
  };
  narrative: string;
}

export interface ProfitabilityInput {
  marketableQuantityKg: number;
  sellingPricePerKg: number;
  productionCost: number;
  recoveryCost?: number;
  transportCost?: number;
  storageCost?: number;
  handlingCost?: number;
}

export interface ProfitabilityResult {
  marketableQuantityKg: number;
  sellingPricePerKg: number;
  grossRevenue: number;
  totalCost: number;
  netProfit: number;
  breakEvenPricePerKg: number;
  profitMarginPercent: number;
  isViable: boolean;
  marginHealth: 'EXCELLENT' | 'HEALTHY' | 'SLIM' | 'LOSS_MAKING';
}

export interface YieldPredictionInput {
  commodity: string;
  farmAcreage: number;
  location: string;
  soilHealthIndex?: number; // 0 - 100
  sowingDate?: string;
  historicalYieldKgPerAcre?: number;
}

export interface YieldPredictionResult {
  commodity: string;
  predictedYieldKg: number;
  yieldPerAcreKg: number;
  confidenceBand: {
    lowKg: number;
    highKg: number;
    confidencePercent: number;
  };
  estimatedHarvestWindow: {
    startDate: string;
    peakDate: string;
    endDate: string;
  };
  influencingFactors: {
    factor: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    description: string;
  }[];
  isSimulatedDemo: boolean;
}

export interface MarketPricePoint {
  day: string;
  date: string;
  predictedPrice: number;
  confidenceLow: number;
  confidenceHigh: number;
  projectedVolumeKg: number;
}

export interface MarketForecastResult {
  commodity: string;
  currentMandiPrice: number;
  trend: DemandTrend;
  forecast7Days: MarketPricePoint[];
  peakPriceDay: string;
  peakPrice: number;
  recommendation: string;
}

export interface StorageOptimizationInput {
  commodity: string;
  marketableQuantityKg: number;
  currentSellingPrice: number;
  projectedFuturePrice: number;
  storageDays: number;
  dailyStorageRatePerKg?: number;
  expectedDailySpoilageRatePercent?: number;
  transportCostCurrent?: number;
  transportCostStorage?: number;
}

export interface StorageOptimizationResult {
  action: SellStoreAction;
  sellNowRealization: {
    pricePerKg: number;
    grossRevenue: number;
    costs: number;
    netFarmerRealization: number;
    netPerKg: number;
  };
  storeFutureRealization: {
    projectedPricePerKg: number;
    storedQuantityAfterSpoilageKg: number;
    spoilageLossKg: number;
    spoilageLossValue: number;
    totalStorageCost: number;
    grossRevenue: number;
    costs: number;
    netFarmerRealization: number;
    netPerKg: number;
  };
  netDifference: number; // Store realization - Sell now realization
  advantagePerKg: number;
  storageDaysRecommended: number;
  reasoning: string;
}

export interface BuyerCandidate {
  id: string;
  name: string;
  company: string;
  buyerType: 'Supermarket Chain' | 'Wholesale Trader' | 'Food Processor' | 'Direct Consumer Group' | 'Institution';
  offeredPricePerKg: number;
  desiredQuantityKg: number;
  acceptedGrades: ProduceQualityGrade[];
  distanceKm: number;
  pickupOffered: boolean;
  paymentTermsDays: number; // 0 = instant, 7 = 7 days
  reliabilityRating: number; // 1.0 - 5.0
  verifiedBuyer: boolean;
  destinationHub: string;
}

export interface BuyerMatchResult {
  buyer: BuyerCandidate;
  compositeScore: number; // 0 - 100
  scoreBreakdown: {
    priceScore: number; // 30%
    quantityScore: number; // 20%
    qualityScore: number; // 15%
    distanceScore: number; // 10%
    deadlinePaymentScore: number; // 10%
    reliabilityScore: number; // 15%
  };
  freightCostEst: number;
  netFarmerRealizationPerKg: number;
  totalFarmerNetEarnings: number;
  isBestMatch: boolean;
  matchHighlights: string[];
}

export interface MandiCandidate {
  id: string;
  name: string;
  district: string;
  state: string;
  distanceKm: number;
  currentMandiPrice: number;
  marketTrend: DemandTrend;
  expectedDemandTons: number;
  freightRatePerKg: number;
  mandiCessAndHandlingPerKg: number;
  estimatedSpoilageTransitPercent: number;
}

export interface DestinationOptimizationResult {
  mandi: MandiCandidate;
  grossRevenue: number;
  transportCost: number;
  handlingCost: number;
  spoilageLossAmount: number;
  netFarmerRealization: number;
  netRealizationPerKg: number;
  rank: number;
  isRecommended: boolean;
  advantageOverLocalPerKg: number;
}

export interface QualityInspectionResult {
  crop: string;
  lotId: string;
  assignedGrade: ProduceQualityGrade;
  confidenceScore: number; // 0 - 100
  blemishRatePercent: number;
  averageDiameterMm: number;
  colorMaturityPercent: number;
  shelfLifeRemainingDays: number;
  pricePremiumDiscountPercent: number; // e.g. +10% for Grade A, -12% for Grade C
  recommendedBasePricePerKg: number;
  marketReadiness: 'IMMEDIATE_DISPATCH' | 'STANDARD_STORAGE' | 'EXPEDITE_PROCESSING';
  prefilledListing: {
    title: string;
    quantityKg: number;
    grade: ProduceQualityGrade;
    suggestedListingPrice: number;
  };
}

export interface ColdChainTelemetryPoint {
  timestamp: string;
  temperatureCelsius: number;
  humidityPercent: number;
  vibrationG: number;
  latitude: number;
  longitude: number;
  coolingCompressorActive: boolean;
}

export interface ColdChainAlert {
  id: string;
  severity: RiskLevel;
  sensor: 'TEMPERATURE' | 'HUMIDITY' | 'DELAY' | 'DOOR_OPEN';
  title: string;
  message: string;
  timeDetected: string;
  suggestedAction: string;
}

export interface ColdChainRiskResult {
  shipmentId: string;
  crop: string;
  currentTempCelsius: number;
  safeTempRange: { min: number; max: number };
  currentHumidityPercent: number;
  safeHumidityRange: { min: number; max: number };
  tempDeviationDegrees: number;
  hoursOutOfRange: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  predictedShelfLifeLossHours: number;
  alerts: ColdChainAlert[];
  recommendedAction: string;
  reeferStatus: 'OPTIMAL' | 'COMPRESSOR_CYCLING' | 'COOLING_FAILURE' | 'DEFROST_CYCLE';
}

export interface RouteOption {
  id: string;
  routeName: string;
  distanceKm: number;
  estimatedHours: number;
  fuelCostInr: number;
  tollCostInr: number;
  coldChainStressIndex: number; // 0 - 100
  co2EmissionsKg: number;
  isRecommended: boolean;
  stopsCount: number;
  roadCondition: 'EXCELLENT' | 'MODERATE' | 'POOR_CONGESTED';
}

export interface RouteOptimizationResult {
  origin: string;
  destination: string;
  recommendedRoute: RouteOption;
  alternativeRoute: RouteOption;
  savingsInr: number;
  hoursSaved: number;
  emissionsAvoidedKg: number;
  spoilageAvoidancePercent: number;
}

export interface RescueChannel {
  type: RescueChannelType;
  partnerName: string;
  offeredPricePerKg: number;
  potentialSalvageValue: number;
  turnaroundHours: number;
  actionRequired: string;
}

export interface FoodLossRiskResult {
  lotId: string;
  commodity: string;
  quantityKg: number;
  currentAgeDays: number;
  maxShelfLifeDays: number;
  remainingShelfLifeHours: number;
  riskLevel: RiskLevel;
  financialExposureInr: number;
  recommendedRescueChannels: RescueChannel[];
  urgentActionHeadline: string;
}

export interface TraceabilityStep {
  stepNumber: number;
  phase: string;
  timestamp: string;
  location: string;
  actor: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  verifiedHash: string;
  details: Record<string, any>;
}

export interface TraceabilityLot {
  lotId: string;
  commodity: string;
  variety: string;
  farmerName: string;
  farmLocation: string;
  harvestDate: string;
  initialQuantityKg: number;
  marketableQuantityKg: number;
  assignedGrade: ProduceQualityGrade;
  soilHealthScore: number;
  weatherShockHistory?: string;
  coldChainTelemetryVerified: boolean;
  qrCodeDataUrl: string;
  currentStatus: string;
  buyerName?: string;
  finalPayoutPerKg?: number;
  steps: TraceabilityStep[];
}

export interface UnifiedIntelligencePipelineResult {
  farmerId: string;
  farmerName: string;
  commodity: string;
  harvestOverview: {
    expectedKg: number;
    damagedKg: number;
    marketableKg: number;
    damagePercent: number;
  };
  pricing: PricingResult;
  weatherShock: WeatherShockResult;
  profitability: ProfitabilityResult;
  topBuyer: BuyerMatchResult;
  allMatchedBuyers: BuyerMatchResult[];
  destinationMarkets: DestinationOptimizationResult[];
  storageAdvice: StorageOptimizationResult;
  coldChainRisk: ColdChainRiskResult;
  traceabilityLotId: string;
  timestamp: string;
}
