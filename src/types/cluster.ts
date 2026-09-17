export type ClusterStatus = 
  | 'Consolidating' 
  | 'Bulk Buyer Match Ready' 
  | 'Bulk Buyer Matching Active' 
  | 'Dispatched' 
  | 'Completed';

export interface ClusterMember {
  id: string;
  clusterId: string;
  farmerId: string;
  farmerName: string; // Privacy-preserved display name e.g. "Farmer A (Shadnagar)" or actual name for self
  farmerArea: string;
  farmerPlace: string;
  role: 'lead' | 'member';
  joinedAt: string;
  isCurrentUser?: boolean;
}

export interface ClusterInventoryItem {
  id: string;
  clusterId: string;
  produceId?: string;
  farmerId: string;
  farmerDisplayName: string; // Privacy-protected identifier (e.g., "Farmer A", "Farmer B")
  quantityKg: number;
  cropName: string;
  qualityGrade: string;
  askingPricePerKg: number;
  distanceFromCenterKm?: number;
  status: 'Pledged' | 'Committed' | 'Dispatched' | 'Sold';
  createdAt: string;
  isCurrentUser?: boolean;
}

export interface BulkBuyerMatch {
  id: string;
  clusterId: string;
  buyerId: string;
  buyerName: string;
  company: string;
  buyerType: 'Supermarket Chain' | 'Food Processor' | 'Wholesale Trader' | 'Direct Consumer Group';
  offeredPricePerKg: number;
  desiredQuantityKg: number;
  matchScore: number;
  destinationHub: string;
  distanceKm: number;
  pickupOffered: boolean;
  paymentTermsDays: number;
  reliabilityRating: number;
  status: 'Proposed' | 'Accepted' | 'Dispatched' | 'Completed';
  estimatedSharedSavingsPercent: number;
  recommendedVehicle: 'Tata 407 Reefer' | 'Mahindra Bolero Maxi Truck';
  matchedAt: string;
}

export interface ClusterEvent {
  id: string;
  clusterId: string;
  eventType: 'THRESHOLD_REACHED' | 'BUYER_MATCH_READY' | 'MEMBER_JOINED' | 'INVENTORY_PLEDGED' | 'DISPATCH_SCHEDULED';
  title: string;
  description: string;
  metadata?: {
    totalKg?: number;
    targetKg?: number;
    farmerCount?: number;
    percentage?: number;
    buyerName?: string;
    offeredPrice?: number;
    [key: string]: any;
  };
  createdAt: string;
}

export interface FarmerCluster {
  id: string;
  name: string; // e.g. "Tomato Cluster — Shadnagar"
  commodity: string; // e.g. "Tomato"
  centerPlace: string; // e.g. "Shadnagar"
  centerDistrict: string;
  centerState: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number; // default: 5 km
  targetBulkKg: number; // default: 1,000 kg (1 tonne)
  currentQuantityKg: number;
  activeFarmersCount: number;
  activeListingsCount: number;
  status: ClusterStatus;
  buyerMatchNotified: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  members?: ClusterMember[];
  inventory?: ClusterInventoryItem[];
  matches?: BulkBuyerMatch[];
  events?: ClusterEvent[];
}

export interface AutoClusterResult {
  cluster: FarmerCluster;
  isNewCluster: boolean;
  message: string;
  newInventoryItem: ClusterInventoryItem;
}
