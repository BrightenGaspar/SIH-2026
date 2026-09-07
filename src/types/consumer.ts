export type BuyerType = 'household' | 'retailer' | 'restaurant' | 'bulk-buyer' | 'institution';
export type ProduceGrade = 'A' | 'B' | 'Organic Certified';
export type FreshnessLevel = 'Harvested Today' | 'Harvested 1 Day Ago' | 'Harvested 2 Days Ago' | 'Harvested 3 Days Ago' | 'Harvested 4 Days Ago';
export type ConsumerOrderStatus = 'Order Placed' | 'Confirmed' | 'Preparing' | 'Pickup' | 'In Transit' | 'Delivered' | 'Cancelled';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type RoadVehicleType = 'Tata Ace' | 'Tata 407 Reefer' | 'Mahindra Bolero Maxi Truck';

export interface ConsumerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'consumer';
  location: string;
  buyerType: BuyerType;
  preferredProduce?: string[];
  preferredGrade?: ProduceGrade;
  typicalOrderSizeKg?: number;
  savedAddresses?: {
    id: string;
    label: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }[];
  createdAt: string;
}

export interface FarmerStory {
  id: string;
  farmerName: string;
  farmOrFpoName: string;
  farmerPhoto: string;
  generalLocation: string;
  district: string;
  state: string;
  mainCrops: string[];
  harvestDate: string;
  soilPractices: string;
  organicPractices: string;
  story: string;
  totalAcresGrown: string;
  fairPriceCommitment: string;
}

export interface PriceBreakdown {
  consumerPricePerKg: number;
  farmerReceivesPerKg: number;
  roadLogisticsPerKg: number;
  platformFeePerKg: number;
  conventionalMarketPricePerKg: number;
  farmerRealizationBoostPercent: number;
}

export interface BulkPriceTier {
  minKg: number;
  maxKg: number | null;
  pricePerKg: number;
  savingsPercent: number;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Spices';
  image: string;
  grade: ProduceGrade;
  gradeDescription: string;
  availableQuantityKg: number;
  minOrderQuantityKg: number;
  harvestDate: string;
  freshness: FreshnessLevel;
  freshnessScore: 'Excellent' | 'High' | 'Good';
  farmerStory: FarmerStory;
  location: string;
  pricePerKg: number;
  bulkAvailable: boolean;
  bulkTiers?: BulkPriceTier[];
  priceBreakdown: PriceBreakdown;
  description: string;
  isColdChainEligible: boolean;
  tags: string[];
}

export interface ProductDetails extends ProductItem {
  shelfLifeDays: number;
  optimalStorageTempCelsius: number;
  nutritionHighlights: string[];
  harvestBatchNumber: string;
  qualityInspectionReport: {
    colorScore: number;
    firmnessScore: number;
    defectPercentage: number;
    inspectionDate: string;
    inspectorName: string;
  };
}

export interface CartItem {
  product: ProductItem;
  quantityKg: number;
  selectedTierPricePerKg: number;
}

export interface ColdChainTelemetry {
  temperatureCelsius: number;
  targetTempCelsius: number;
  humidityPercent: number;
  safeWindowHours: number;
  safeWindowMinutes: number;
  riskLevel: RiskLevel;
  reeferActive: boolean;
  isSimulated: boolean;
  explanation: string;
}

export interface DeliveryWaypoint {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface MultiFarmerSource {
  farmerOrFpoId: string;
  name: string;
  location: string;
  quantityKg: number;
  grade: ProduceGrade;
  contributionPercent: number;
}

export interface ImpactReceipt {
  orderId: string;
  produceName: string;
  totalQuantityKg: number;
  totalPaid: number;
  farmerShareTotal: number;
  roadLogisticsTotal: number;
  platformFeeTotal: number;
  farmerRealizationGainTotal: number;
  farmerRealizationGainPercent: number;
  co2ReductionKgEstimate: number;
  emptyKmSaved: number;
  directFarmersEmpoweredCount: number;
  statement: string;
  timestamp: string;
}

export interface ConsumerTracking {
  id: string;
  orderId: string;
  vehicleType: RoadVehicleType;
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
  status: ConsumerOrderStatus;
  progressPercent: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  coldChainTelemetry?: ColdChainTelemetry;
  returnLoadAvailable?: {
    route: string;
    commodity: string;
    additionalEarnings: number;
    emptyDistanceAvoidedKm: number;
  };
  timeline: DeliveryWaypoint[];
  isSimulatedGPS: boolean;
}

export interface ConsumerOrder {
  id: string;
  items: CartItem[];
  totalQuantityKg: number;
  subtotal: number;
  roadLogisticsFee: number;
  platformFee: number;
  totalAmount: number;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'UPI' | 'Card' | 'Demo Cash';
  orderDate: string;
  status: ConsumerOrderStatus;
  logisticsId?: string;
  multiFarmerSources?: MultiFarmerSource[];
  impactReceipt?: ImpactReceipt;
  estimatedDeliveryDate: string;
  isBulkOrder?: boolean;
}

export interface BulkDemand {
  id: string;
  buyerId: string;
  produceName: string;
  requiredQuantityKg: number;
  requiredGrade: ProduceGrade;
  deliveryLocation: string;
  deliveryCity: string;
  preferredDeliveryDate: string;
  deliveryWindow: string;
  maxBudgetPerKg: number;
  matchedQuantityKg: number;
  remainingQuantityKg: number;
  matchedSuppliers: MultiFarmerSource[];
  status: 'Draft' | 'Matching' | 'Matched' | 'Consolidating' | 'Dispatched' | 'Fulfilled';
  roadRouteDetails: {
    traditionalDistanceKm: number;
    traditionalCost: number;
    traditionalHours: number;
    optimizedDistanceKm: number;
    optimizedCost: number;
    optimizedHours: number;
    distanceSavedKm: number;
    costSavedINR: number;
    hoursSaved: number;
  };
  createdAt: string;
}

export interface Recommendation {
  id: string;
  produceName: string;
  productId: string;
  headline: string;
  explanation: string;
  grade: ProduceGrade;
  freshness: FreshnessLevel;
  pricePerKg: number;
  farmerName: string;
  distanceKm: number;
  matchingScorePercent: number;
  image: string;
  suitableBuyerTypes: BuyerType[];
}
