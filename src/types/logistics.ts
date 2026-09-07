import { RoadVehicleType } from './delivery';

export interface LogisticsOperator {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'logistics';
  vehicleType: RoadVehicleType;
  vehicleNumber: string;
  vehicleCapacityKg: number;
  reeferEnabled: boolean;
  operatingRegion: string;
  preferredRoutes: string[];
  createdAt: string;
}
