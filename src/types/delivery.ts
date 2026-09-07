export type DeliveryStatus =
  | 'ORDER CONFIRMED'
  | 'PICKUP SCHEDULED'
  | 'DRIVER ASSIGNED'
  | 'PICKUP STARTED'
  | 'PRODUCE PICKED UP'
  | 'IN TRANSIT'
  | 'APPROACHING DESTINATION'
  | 'ARRIVED'
  | 'DELIVERED';

export type RoadVehicleType = 'Tata Ace' | 'Tata 407 Reefer' | 'Mahindra Bolero Maxi Truck';
export type SpoilageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ColdChainTelemetry {
  temperatureCelsius: number;
  targetTempCelsius: number;
  humidityPercent: number;
  safeWindowHours: number;
  safeWindowMinutes: number;
  spoilageRisk: SpoilageRiskLevel;
  reeferActive: boolean;
  explanation?: string;
}

export interface DeliveryWaypoint {
  id: string;
  title: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface ReturnLoadDetails {
  route: string;
  commodity: string;
  additionalEarnings: number;
  emptyDistanceAvoidedKm: number;
}

export interface ProofOfDelivery {
  receivedBy: string;
  timestamp: string;
  verificationCode: string;
  photoUrl?: string;
  isVerified: boolean;
  notes?: string;
}

export interface DeliveryTracking {
  id: string;
  tripId: string;
  orderId: string;
  produceName: string;
  totalQuantityKg: number;
  status: DeliveryStatus;
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
  distanceRemainingKm: number;
  distanceCompletedKm: number;
  totalDistanceKm: number;
  progressPercentage: number;
  etaMinutes: number;
  telemetry: ColdChainTelemetry;
  returnLoad?: ReturnLoadDetails;
  waypoints: DeliveryWaypoint[];
  routeCoordinates: [number, number][];
  proofOfDelivery?: ProofOfDelivery;
}