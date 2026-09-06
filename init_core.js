const fs = require('fs');
const path = require('path');

function write(relPath, content) {
  const full = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trim() + '\n', 'utf8');
  console.log('Created: ' + relPath);
}

// 1. types/farmer.ts
write('src/types/farmer.ts', \
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
\);

// 2. lib/utils.ts
write('src/lib/utils.ts', \
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
\);

// 3. lib/validators.ts
write('src/lib/validators.ts', \
import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone number or email is required'),
  password: z.string().min(4, 'Password or OTP must be at least 4 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().email('Valid email address is required').or(z.literal('')),
  farmName: z.string().min(2, 'Farm or FPO name is required'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  village: z.string().min(2, 'Village or locality is required'),
  farmSize: z.string().min(1, 'Farm size is required'),
  primaryCrops: z.string().min(2, 'Please specify primary crops'),
  farmerType: z.enum(['Individual Farmer', 'FPO', 'Farmer Group']),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const produceSchema = z.object({
  crop: z.string().min(2, 'Produce/crop name is required'),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
  unit: z.string().default('kg'),
  grade: z.enum(['A', 'A-', 'B', 'B-', 'C', 'C-', 'D']),
  harvestDate: z.string().min(4, 'Harvest date is required'),
  expectedPrice: z.number({ invalid_type_error: 'Price must be a number' }).positive('Expected price must be greater than 0'),
  location: z.string().min(2, 'Pickup location is required'),
  notes: z.string().optional(),
});

export type ProduceFormData = z.infer<typeof produceSchema>;
\);

// 4. Mock Data
write('src/services/mockData/sihScenarioData.ts', \
import { SIHScenarioData } from '@/types/farmer';

export const mockSIHScenario: SIHScenarioData = {
  commodity: 'Tomato (Hybrid Desi)',
  buyerLocation: 'Bowenpally Wholesale & Direct Buyer Hub, Hyderabad',
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
\);

write('src/services/mockData/mockProduce.ts', \
import { Produce } from '@/types/farmer';

export const initialProduceList: Produce[] = [
  {
    id: 'prod-001',
    crop: 'Tomato (Hybrid)',
    quantity: 2400,
    unit: 'kg',
    grade: 'A',
    harvestDate: '2026-09-04',
    expectedPrice: 42,
    location: 'Shadnagar FPO Cluster, Telangana',
    status: 'Active',
    notes: 'Uniform red ripeness, 0 defects, stored in crate units.',
    createdAt: '2026-09-04T08:30:00Z',
  },
  {
    id: 'prod-002',
    crop: 'Green Chilli (G4)',
    quantity: 1200,
    unit: 'kg',
    grade: 'A-',
    harvestDate: '2026-09-05',
    expectedPrice: 58,
    location: 'Guntur Rural, Andhra Pradesh',
    status: 'Active',
    notes: 'Dark green, strong spice profile, clean sorted.',
    createdAt: '2026-09-05T10:15:00Z',
  },
  {
    id: 'prod-003',
    crop: 'Onion (Nashik Red)',
    quantity: 5000,
    unit: 'kg',
    grade: 'B+',
    harvestDate: '2026-08-28',
    expectedPrice: 28,
    location: 'Medak FPO Hub, Telangana',
    status: 'Reserved',
    notes: 'Medium bulb diameter, dry outer skin.',
    createdAt: '2026-08-28T14:00:00Z',
  },
  {
    id: 'prod-004',
    crop: 'Potato (Jyoti)',
    quantity: 3500,
    unit: 'kg',
    grade: 'A',
    harvestDate: '2026-08-20',
    expectedPrice: 22,
    location: 'Zaheerabad Farm Center, Telangana',
    status: 'Sold',
    notes: 'Delivered to Hyderabad Quick Commerce Dark Store.',
    createdAt: '2026-08-20T09:00:00Z',
  }
];
\);

write('src/services/mockData/mockPrices.ts', \
import { MarketPrice, PriceTrendPoint } from '@/types/farmer';

export const mockMarketPrices: MarketPrice[] = [
  {
    id: 'mp-001',
    commodity: 'Tomato',
    marketName: 'Hyderabad (Bowenpally)',
    district: 'Hyderabad',
    state: 'Telangana',
    currentPrice: 38.00,
    previousPrice: 35.50,
    change: 2.50,
    percentageChange: 7.04,
    bulkBuyerOpportunityPrice: 42.00,
    date: '2026-09-06',
  },
  {
    id: 'mp-002',
    commodity: 'Tomato',
    marketName: 'Gaddiannaram Mandi',
    district: 'Rangareddy',
    state: 'Telangana',
    currentPrice: 36.50,
    previousPrice: 36.00,
    change: 0.50,
    percentageChange: 1.39,
    bulkBuyerOpportunityPrice: 41.50,
    date: '2026-09-06',
  },
  {
    id: 'mp-003',
    commodity: 'Tomato',
    marketName: 'Kolar Mandi',
    district: 'Kolar',
    state: 'Karnataka',
    currentPrice: 34.00,
    previousPrice: 36.00,
    change: -2.00,
    percentageChange: -5.55,
    bulkBuyerOpportunityPrice: 39.00,
    date: '2026-09-06',
  },
  {
    id: 'mp-004',
    commodity: 'Green Chilli',
    marketName: 'Warangal Mandi',
    district: 'Warangal',
    state: 'Telangana',
    currentPrice: 52.00,
    previousPrice: 49.00,
    change: 3.00,
    percentageChange: 6.12,
    bulkBuyerOpportunityPrice: 58.00,
    date: '2026-09-06',
  },
  {
    id: 'mp-005',
    commodity: 'Onion',
    marketName: 'Mahabubnagar Mandi',
    district: 'Mahabubnagar',
    state: 'Telangana',
    currentPrice: 24.50,
    previousPrice: 24.00,
    change: 0.50,
    percentageChange: 2.08,
    bulkBuyerOpportunityPrice: 28.00,
    date: '2026-09-06',
  },
  {
    id: 'mp-006',
    commodity: 'Potato',
    marketName: 'Nizamabad Mandi',
    district: 'Nizamabad',
    state: 'Telangana',
    currentPrice: 19.00,
    previousPrice: 19.50,
    change: -0.50,
    percentageChange: -2.56,
    bulkBuyerOpportunityPrice: 22.50,
    date: '2026-09-06',
  }
];

export const mockPriceTrendData: PriceTrendPoint[] = [
  { day: 'Day -6', currentMandi: 33.5, forecastedPrice: 33.5, buyerDemandPrice: 37.0 },
  { day: 'Day -4', currentMandi: 34.0, forecastedPrice: 34.5, buyerDemandPrice: 38.5 },
  { day: 'Day -2', currentMandi: 36.0, forecastedPrice: 36.0, buyerDemandPrice: 40.0 },
  { day: 'Today', currentMandi: 38.0, forecastedPrice: 38.0, buyerDemandPrice: 42.0 },
  { day: 'Day +2', currentMandi: 39.2, forecastedPrice: 39.8, buyerDemandPrice: 43.5 },
  { day: 'Day +4 (Best)', currentMandi: 40.0, forecastedPrice: 41.2, buyerDemandPrice: 45.0 },
  { day: 'Day +6', currentMandi: 39.0, forecastedPrice: 39.5, buyerDemandPrice: 43.0 },
];
\);

write('src/services/mockData/mockForecasts.ts', \
import { AIRecommendation, DemandZone, ProducePool } from '@/types/farmer';

export const mockDemandZones: DemandZone[] = [
  {
    id: 'dz-01',
    region: 'Hyderabad Urban Cluster',
    state: 'Telangana',
    commodity: 'Tomato',
    lat: 17.385044,
    lng: 78.486671,
    demandKg: 5000,
    supplyKg: 3200,
    gapKg: 1800,
    opportunityLevel: 'High',
    pricePerKg: 42.00,
    buyerCount: 14,
  },
  {
    id: 'dz-02',
    region: 'Warangal Commercial Belt',
    state: 'Telangana',
    commodity: 'Tomato',
    lat: 17.9689,
    lng: 79.5941,
    demandKg: 3000,
    supplyKg: 2800,
    gapKg: 200,
    opportunityLevel: 'Moderate',
    pricePerKg: 37.50,
    buyerCount: 6,
  },
  {
    id: 'dz-03',
    region: 'Bengaluru Agri Terminal',
    state: 'Karnataka',
    commodity: 'Tomato',
    lat: 12.9716,
    lng: 77.5946,
    demandKg: 8500,
    supplyKg: 9200,
    gapKg: -700,
    opportunityLevel: 'Normal',
    pricePerKg: 34.00,
    buyerCount: 22,
  },
  {
    id: 'dz-04',
    region: 'Vijayawada Retail Consolidation',
    state: 'Andhra Pradesh',
    commodity: 'Green Chilli',
    lat: 16.5062,
    lng: 80.6480,
    demandKg: 4200,
    supplyKg: 2600,
    gapKg: 1600,
    opportunityLevel: 'High',
    pricePerKg: 58.00,
    buyerCount: 9,
  }
];

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-01',
    title: 'Sell Tomato to Hyderabad Wholesale & Institutional Hub',
    actionText: 'Dispatch to Hyderabad Bulk Pool',
    score: 91,
    expectedImprovementPerKg: 4.00,
    confidence: 88,
    summary: 'High demand deficit of 1,800 kg in Bowenpally corridor. Better realization than local Mandi with consolidated road transport.',
    factors: {
      demandStrength: 92,
      distanceScore: 86,
      freshnessScore: 90,
      expectedPriceScore: 88,
      fairRealizationScore: 94,
    },
    reasoning: [
      'Demand in Hyderabad is 18% above regional supply levels.',
      'Nearby Mandi prices are capped at ?38/kg vs ?42/kg buyer direct realization.',
      'Produce Grade A qualifies for zero-rejection fast-track lane.',
      'Consolidating with 3 Shadnagar farmers saves 34% road freight.'
    ],
    recommendedMarket: 'Bowenpally Institutional Hub, Hyderabad',
    bestTimeToSellDays: 4,
  },
  {
    id: 'rec-02',
    title: 'Hold Green Chilli inventory for 3 days for price surge',
    actionText: 'Schedule Dispatch in 72 hrs',
    score: 84,
    expectedImprovementPerKg: 6.00,
    confidence: 81,
    summary: 'Vijayawada terminal supply arriving from North is delayed. Prices projected to jump +?6.00/kg by Thursday.',
    factors: {
      demandStrength: 85,
      distanceScore: 78,
      freshnessScore: 92,
      expectedPriceScore: 90,
      fairRealizationScore: 82,
    },
    reasoning: [
      'Monsoon logistics bottleneck is slowing incoming shipments from Maharashtra.',
      'Local demand remains steady with institutional buyers bidding actively.',
      'Safe window in farm cold-shed is 120+ hours (Low spoilage risk).'
    ],
    recommendedMarket: 'Vijayawada Agri Terminal',
    bestTimeToSellDays: 3,
  }
];

export const mockProducePools: ProducePool[] = [
  {
    id: 'pool-hyd-tomato',
    targetCommodity: 'Tomato (Hybrid Desi)',
    destination: 'Hyderabad Central Food Logistics Hub',
    targetQuantityKg: 5000,
    currentQuantityKg: 5000,
    buyerName: 'FreshBaskets & SuperMarket Consortium',
    offeredPricePerKg: 42.00,
    estimatedFreightSavingsPercent: 38,
    participants: [
      { id: 'p1', farmerName: 'Ramesh Reddy (Your Contribution)', quantityKg: 1200, isCurrentUser: true },
      { id: 'p2', farmerName: 'Suresh Kumar (FPO Unit B)', quantityKg: 800 },
      { id: 'p3', farmerName: 'Venkatesh Rao (Chevella Farm)', quantityKg: 1500 },
      { id: 'p4', farmerName: 'Laxmi Farmer Producer Co.', quantityKg: 1500 },
    ],
    deadline: '2026-09-07T18:00:00Z',
    status: 'Consolidating',
  },
  {
    id: 'pool-vja-chilli',
    targetCommodity: 'Green Chilli (G4)',
    destination: 'Vijayawada Commercial Cluster',
    targetQuantityKg: 3000,
    currentQuantityKg: 1800,
    buyerName: 'Andhra Spice Exporters & Wholesalers',
    offeredPricePerKg: 58.00,
    estimatedFreightSavingsPercent: 28,
    participants: [
      { id: 'p5', farmerName: 'Guntur Spice Cluster A', quantityKg: 1000 },
      { id: 'p6', farmerName: 'Krishna Valley Growers', quantityKg: 800 },
    ],
    deadline: '2026-09-08T12:00:00Z',
    status: 'Open',
  }
];
\);

write('src/services/mockData/mockOrders.ts', \
import { Order, RoadLogisticsTracking } from '@/types/farmer';

export const mockOrders: Order[] = [
  {
    id: 'ORD-78921',
    buyerName: 'FreshDirect Hypermarkets Pvt Ltd',
    buyerType: 'Institutional Retail Buyer',
    produceName: 'Tomato (Hybrid Desi)',
    quantityKg: 2400,
    grade: 'A',
    pricePerKg: 42.00,
    totalOrderValue: 100800,
    orderDate: '2026-09-05',
    pickupDate: '2026-09-06 09:30 AM',
    deliveryDate: '2026-09-06 05:45 PM',
    status: 'In Transit',
    logisticsId: 'TRK-RD-9021',
    destinationCity: 'Hyderabad, Telangana',
  },
  {
    id: 'ORD-78410',
    buyerName: 'Telangana Agri Processing Co.',
    buyerType: 'Food Processor',
    produceName: 'Green Chilli (G4)',
    quantityKg: 1200,
    grade: 'A-',
    pricePerKg: 58.00,
    totalOrderValue: 69600,
    orderDate: '2026-09-04',
    pickupDate: '2026-09-05',
    deliveryDate: '2026-09-05',
    status: 'Delivered',
    logisticsId: 'TRK-RD-8812',
    destinationCity: 'Warangal, Telangana',
  },
  {
    id: 'ORD-79102',
    buyerName: 'Southern Retail Hubs',
    buyerType: 'Consortium Buyer',
    produceName: 'Onion (Nashik Red)',
    quantityKg: 5000,
    grade: 'B+',
    pricePerKg: 28.00,
    totalOrderValue: 140000,
    orderDate: '2026-09-06',
    pickupDate: '2026-09-07 10:00 AM',
    status: 'Confirmed',
    logisticsId: 'TRK-RD-9140',
    destinationCity: 'Hyderabad, Telangana',
  }
];

export const mockTrackingDetails: Record<string, RoadLogisticsTracking> = {
  'TRK-RD-9021': {
    id: 'TRK-RD-9021',
    orderId: 'ORD-78921',
    vehicleType: 'Tata 407 Reefer',
    vehicleNumber: 'TS 08 UB 4192',
    driverName: 'Mohammed Ismail',
    driverPhone: '+91 98480 22341',
    pickupLocation: 'Shadnagar FPO Hub, Telangana',
    destinationLocation: 'Bowenpally Agri Hub, Hyderabad',
    currentLocationName: 'Shamshabad Outer Ring Road Tollway',
    currentCoordinates: [17.2403, 78.4294],
    pickupCoordinates: [17.0684, 78.2078],
    destinationCoordinates: [17.4729, 78.4842],
    estimatedArrival: 'Today, 05:45 PM',
    status: 'In Transit',
    progressPercent: 68,
    distanceRemainingKm: 28,
    totalDistanceKm: 74,
    isSimulatedGPS: true,
    spoilageTelemetry: {
      temperatureCelsius: 6.2,
      targetTempCelsius: 6.0,
      humidityPercent: 88,
      safeWindowHours: 4,
      safeWindowMinutes: 32,
      riskLevel: 'Low',
      isSimulated: true,
    },
    returnLoad: {
      id: 'RET-HYD-WGL-01',
      origin: 'Hyderabad Agri Terminal',
      destination: 'Warangal Produce Hub',
      commodity: 'Organic Fertilizer Sacks & Seedlings',
      additionalEarnings: 2800,
      emptyDistanceAvoidedKm: 142,
      status: 'Available',
      isDemoData: true,
    },
    timeline: [
      { title: 'Produce Loaded & Graded', location: 'Shadnagar FPO Hub', timestamp: '09:30 AM', completed: true },
      { title: 'Driver Assigned & Inspected', location: 'Tata 407 Reefer (TS 08 UB 4192)', timestamp: '10:00 AM', completed: true },
      { title: 'Trip Started (Road Route)', location: 'Departed Shadnagar', timestamp: '10:30 AM', completed: true },
      { title: 'In Transit — ORR Corridor', location: 'Shamshabad (Speed: 52 km/h)', timestamp: '03:15 PM', completed: true, current: true },
      { title: 'Arrival at Destination', location: 'Bowenpally Agri Hub, Hyderabad', timestamp: '05:45 PM (ETA)', completed: false },
      { title: 'Unloading & Payment Release', location: 'Inspection Gate 3', timestamp: 'Pending', completed: false },
    ],
  },
};
\);

console.log('Types, Libs, and Mock Data written successfully!');
