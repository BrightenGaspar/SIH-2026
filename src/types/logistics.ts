import { RoadVehicleType } from './delivery';

export type SupportedLanguage = 'en' | 'te' | 'ta' | 'ml' | 'hi' | 'bn' | 'mr';

export interface LogisticsOperator {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoURL?: string;
  role: 'logistics';
  address?: string;
  state?: string;
  district?: string;
  place?: string;
  preferredLanguage?: SupportedLanguage;
  profileCompleted?: boolean;
  vehicleType: RoadVehicleType;
  vehicleNumber: string;
  vehicleCapacityKg: number;
  reeferEnabled: boolean;
  operatingRegion: string;
  preferredRoutes: string[];
  createdAt: string;
}

export interface LogisticsFleetVehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: RoadVehicleType;
  capacityKg: number;
  currentLoadKg: number;
  driverName: string;
  driverPhone?: string;
  status: 'In Transit' | 'Available' | 'Maintenance' | 'Loading';
  reeferActive: boolean;
  currentTempCelsius?: number;
  currentLocation: string;
  currentLat?: number;
  currentLng?: number;
  assignedTripId?: string;
}

export interface ConsolidatedTrip {
  id: string;
  tripCode: string;
  vehicle: LogisticsFleetVehicle;
  sourceHub: string;
  destinationHub: string;
  totalDistanceKm: number;
  distanceCompletedKm: number;
  commodity: string;
  totalKg: number;
  pickups: {
    fpoName: string;
    location: string;
    qtyKg: number;
    status: 'Loaded' | 'Pending' | 'En Route';
  }[];
  status: 'IN TRANSIT' | 'In Transit' | 'DELIVERED' | 'Delivered' | 'SCHEDULED' | 'LOADING' | 'DISPATCH_OFFERED' | 'DISPATCH_REQUESTED' | 'PLACED';
  estimatedArrival: string;
  coldChainTemp?: number;
  spoilageRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  farmerId?: string;
  customerId?: string;
  returnLoad?: {
    id: string;
    route: string;
    commodity: string;
    weightKg: number;
    additionalEarnings: number;
    emptyDistanceAvoidedKm: number;
    isClaimed: boolean;
  };
}
