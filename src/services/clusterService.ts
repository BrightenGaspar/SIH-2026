import { supabase } from '@/lib/supabase';
import { 
  FarmerCluster, 
  ClusterMember, 
  ClusterInventoryItem, 
  BulkBuyerMatch, 
  ClusterEvent, 
  AutoClusterResult 
} from '@/types/cluster';
import { matchBuyers, CANDIDATE_BUYERS } from '@/services/buyerMatchingService';
import { ProduceQualityGrade } from '@/types/intelligence';

// Known agricultural hub geocoding coordinates for Telangana / Andhra / Maharashtra
export const KNOWN_AGRI_HUBS: Record<string, { lat: number; lng: number; district: string; state: string }> = {
  'shadnagar': { lat: 17.0722, lng: 78.2078, district: 'Ranga Reddy', state: 'Telangana' },
  'farooqnagar': { lat: 17.0650, lng: 78.2010, district: 'Ranga Reddy', state: 'Telangana' },
  'kothur': { lat: 17.1472, lng: 78.2891, district: 'Ranga Reddy', state: 'Telangana' },
  'shamshabad': { lat: 17.2522, lng: 78.3478, district: 'Ranga Reddy', state: 'Telangana' },
  'chevella': { lat: 17.3080, lng: 78.1360, district: 'Ranga Reddy', state: 'Telangana' },
  'zaheerabad': { lat: 17.6833, lng: 77.6000, district: 'Sangareddy', state: 'Telangana' },
  'patancheru': { lat: 17.5280, lng: 78.2670, district: 'Sangareddy', state: 'Telangana' },
  'bowenpally': { lat: 17.4722, lng: 78.4878, district: 'Hyderabad', state: 'Telangana' },
  'nashik': { lat: 19.9975, lng: 73.7898, district: 'Nashik', state: 'Maharashtra' },
  'guntur': { lat: 16.3067, lng: 80.4365, district: 'Guntur', state: 'Andhra Pradesh' },
};

/**
 * Haversine distance formula in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Resolve coordinates from place / area string
 */
export function resolveCoordinates(place?: string, area?: string): { lat: number; lng: number } {
  const query = `${area || ''} ${place || ''}`.toLowerCase();
  for (const [hub, coords] of Object.entries(KNOWN_AGRI_HUBS)) {
    if (query.includes(hub)) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }
  // Default fallback to Shadnagar Agri Corridor
  return { lat: 17.0722, lng: 78.2078 };
}

// Initial realistic seed clusters matching prompt specifications
const INITIAL_SEED_CLUSTERS: FarmerCluster[] = [
  {
    id: 'cluster-shadnagar-tomato-01',
    name: 'Tomato Cluster — Shadnagar',
    commodity: 'Tomato (Hybrid Desi)',
    centerPlace: 'Shadnagar',
    centerDistrict: 'Ranga Reddy',
    centerState: 'Telangana',
    centerLat: 17.0722,
    centerLng: 78.2078,
    radiusKm: 5.0,
    targetBulkKg: 1000.0, // 1 tonne bulk threshold
    currentQuantityKg: 1100.0, // 1,100 kg (Exceeds 1 tonne target!)
    activeFarmersCount: 4,
    activeListingsCount: 4,
    status: 'Bulk Buyer Matching Active',
    buyerMatchNotified: true,
    createdAt: '2026-09-12T08:30:00Z',
    updatedAt: '2026-09-14T10:15:00Z',
    inventory: [
      {
        id: 'inv-01',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-a',
        farmerDisplayName: 'Farmer A (Shadnagar West)',
        quantityKg: 250,
        cropName: 'Tomato (Hybrid Desi)',
        qualityGrade: 'Grade A',
        askingPricePerKg: 28.0,
        distanceFromCenterKm: 1.8,
        status: 'Pledged',
        createdAt: '2026-09-12T09:00:00Z',
      },
      {
        id: 'inv-02',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-b',
        farmerDisplayName: 'Farmer B (Farooqnagar Road)',
        quantityKg: 300,
        cropName: 'Tomato (Hybrid Desi)',
        qualityGrade: 'Grade A',
        askingPricePerKg: 28.5,
        distanceFromCenterKm: 2.6,
        status: 'Pledged',
        createdAt: '2026-09-12T11:20:00Z',
      },
      {
        id: 'inv-03',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-c',
        farmerDisplayName: 'Farmer C (Shadnagar Rural)',
        quantityKg: 200,
        cropName: 'Tomato (Hybrid Desi)',
        qualityGrade: 'Grade B',
        askingPricePerKg: 27.0,
        distanceFromCenterKm: 3.4,
        status: 'Pledged',
        createdAt: '2026-09-13T07:45:00Z',
      },
      {
        id: 'inv-04',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-d',
        farmerDisplayName: 'Farmer D (Kothur Border)',
        quantityKg: 350,
        cropName: 'Tomato (Hybrid Desi)',
        qualityGrade: 'Grade A',
        askingPricePerKg: 29.0,
        distanceFromCenterKm: 4.2,
        status: 'Pledged',
        createdAt: '2026-09-13T14:10:00Z',
      },
    ],
    members: [
      {
        id: 'mem-01',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-a',
        farmerName: 'Farmer A (Shadnagar West)',
        farmerArea: 'Shadnagar West',
        farmerPlace: 'Shadnagar',
        role: 'lead',
        joinedAt: '2026-09-12T09:00:00Z',
      },
      {
        id: 'mem-02',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-b',
        farmerName: 'Farmer B (Farooqnagar Road)',
        farmerArea: 'Farooqnagar',
        farmerPlace: 'Shadnagar',
        role: 'member',
        joinedAt: '2026-09-12T11:20:00Z',
      },
      {
        id: 'mem-03',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-c',
        farmerName: 'Farmer C (Shadnagar Rural)',
        farmerArea: 'Rural Sector 4',
        farmerPlace: 'Shadnagar',
        role: 'member',
        joinedAt: '2026-09-13T07:45:00Z',
      },
      {
        id: 'mem-04',
        clusterId: 'cluster-shadnagar-tomato-01',
        farmerId: 'farmer-d',
        farmerName: 'Farmer D (Kothur Border)',
        farmerArea: 'Kothur Road',
        farmerPlace: 'Shadnagar',
        role: 'member',
        joinedAt: '2026-09-13T14:10:00Z',
      },
    ],
    matches: [
      {
        id: 'match-01',
        clusterId: 'cluster-shadnagar-tomato-01',
        buyerId: 'buyer-reliance-retail',
        buyerName: 'Reliance Fresh Distribution Center',
        company: 'Reliance Retail Ltd',
        buyerType: 'Supermarket Chain',
        offeredPricePerKg: 54.0,
        desiredQuantityKg: 3000,
        matchScore: 94,
        destinationHub: 'Shamshabad Logistics Park, Hyderabad',
        distanceKm: 38,
        pickupOffered: true,
        paymentTermsDays: 2,
        reliabilityRating: 4.9,
        status: 'Proposed',
        estimatedSharedSavingsPercent: 38,
        recommendedVehicle: 'Tata 407 Reefer',
        matchedAt: '2026-09-14T10:15:00Z',
      },
      {
        id: 'match-02',
        clusterId: 'cluster-shadnagar-tomato-01',
        buyerId: 'buyer-bigbasket',
        buyerName: 'BigBasket Fulfillment Hub',
        company: 'Supermarket Grocery Supplies',
        buyerType: 'Supermarket Chain',
        offeredPricePerKg: 53.5,
        desiredQuantityKg: 1500,
        matchScore: 91,
        destinationHub: 'Medchal Hub, Hyderabad',
        distanceKm: 46,
        pickupOffered: true,
        paymentTermsDays: 1,
        reliabilityRating: 4.8,
        status: 'Proposed',
        estimatedSharedSavingsPercent: 34,
        recommendedVehicle: 'Tata 407 Reefer',
        matchedAt: '2026-09-14T10:15:00Z',
      },
      {
        id: 'match-03',
        clusterId: 'cluster-shadnagar-tomato-01',
        buyerId: 'buyer-kisan-agro',
        buyerName: 'Kisan Agro Puree Plant',
        company: 'Kisan Agro Foods Pvt Ltd',
        buyerType: 'Food Processor',
        offeredPricePerKg: 49.0,
        desiredQuantityKg: 8000,
        matchScore: 85,
        destinationHub: 'Patancheru Industrial Area',
        distanceKm: 62,
        pickupOffered: false,
        paymentTermsDays: 0,
        reliabilityRating: 4.6,
        status: 'Proposed',
        estimatedSharedSavingsPercent: 28,
        recommendedVehicle: 'Tata 407 Reefer',
        matchedAt: '2026-09-14T10:15:00Z',
      },
    ],
    events: [
      {
        id: 'evt-01',
        clusterId: 'cluster-shadnagar-tomato-01',
        eventType: 'THRESHOLD_REACHED',
        title: 'Bulk Buyer Target Met: 1,100 kg (110%)',
        description: 'Cluster reached 1,100 kg across 4 farmers within 5 km radius, triggering instant bulk buyer match notifications.',
        metadata: {
          totalKg: 1100,
          targetKg: 1000,
          farmerCount: 4,
          percentage: 110.0,
        },
        createdAt: '2026-09-13T14:15:00Z',
      },
      {
        id: 'evt-02',
        clusterId: 'cluster-shadnagar-tomato-01',
        eventType: 'BUYER_MATCH_READY',
        title: '3 Institutional Bulk Buyers Matched',
        description: 'Top candidate Reliance Fresh offers ₹54.00/kg with farmgate cold reefer pickup.',
        metadata: {
          buyerName: 'Reliance Fresh Distribution Center',
          offeredPrice: 54.0,
        },
        createdAt: '2026-09-13T14:20:00Z',
      },
    ],
  },
  {
    id: 'cluster-kothur-chilli-02',
    name: 'Green Chilli Cluster — Kothur',
    commodity: 'Green Chilli (G4)',
    centerPlace: 'Kothur',
    centerDistrict: 'Ranga Reddy',
    centerState: 'Telangana',
    centerLat: 17.1472,
    centerLng: 78.2891,
    radiusKm: 5.0,
    targetBulkKg: 1000.0,
    currentQuantityKg: 650.0, // 650 kg (Consolidating)
    activeFarmersCount: 3,
    activeListingsCount: 3,
    status: 'Consolidating',
    buyerMatchNotified: false,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: '2026-09-14T08:00:00Z',
    inventory: [
      {
        id: 'inv-11',
        clusterId: 'cluster-kothur-chilli-02',
        farmerId: 'farmer-e',
        farmerDisplayName: 'Farmer E (Kothur North)',
        quantityKg: 250,
        cropName: 'Green Chilli (G4)',
        qualityGrade: 'Grade A',
        askingPricePerKg: 45.0,
        distanceFromCenterKm: 1.2,
        status: 'Pledged',
        createdAt: '2026-09-13T10:30:00Z',
      },
      {
        id: 'inv-12',
        clusterId: 'cluster-kothur-chilli-02',
        farmerId: 'farmer-f',
        farmerDisplayName: 'Farmer F (Thimmapur)',
        quantityKg: 220,
        cropName: 'Green Chilli (G4)',
        qualityGrade: 'Grade A',
        askingPricePerKg: 46.0,
        distanceFromCenterKm: 2.8,
        status: 'Pledged',
        createdAt: '2026-09-13T13:40:00Z',
      },
      {
        id: 'inv-13',
        clusterId: 'cluster-kothur-chilli-02',
        farmerId: 'farmer-g',
        farmerDisplayName: 'Farmer G (Nandigama Road)',
        quantityKg: 180,
        cropName: 'Green Chilli (G4)',
        qualityGrade: 'Grade B',
        askingPricePerKg: 43.0,
        distanceFromCenterKm: 4.1,
        status: 'Pledged',
        createdAt: '2026-09-14T07:15:00Z',
      },
    ],
    members: [],
    matches: [],
    events: [
      {
        id: 'evt-11',
        clusterId: 'cluster-kothur-chilli-02',
        eventType: 'MEMBER_JOINED',
        title: 'New Member Joined Cluster',
        description: 'Farmer G pledged 180 kg bringing total to 650 kg (65% of target).',
        metadata: { totalKg: 650, targetKg: 1000, percentage: 65 },
        createdAt: '2026-09-14T07:15:00Z',
      },
    ],
  },
];

// Local in-memory cache for seamless fallback and high responsiveness
let memoryClusters: FarmerCluster[] = [...INITIAL_SEED_CLUSTERS];

/**
 * Load persistent clusters from localStorage if in browser
 */
function getStoredClusters(): FarmerCluster[] {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem('agriflow_farmer_clusters');
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryClusters = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore parse error and return memory
    }
  }
  return memoryClusters;
}

/**
 * Save clusters to localStorage
 */
function saveStoredClusters(clusters: FarmerCluster[]) {
  memoryClusters = clusters;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('agriflow_farmer_clusters', JSON.stringify(clusters));
    } catch {
      // Ignore quota errors
    }
  }
}

export const clusterService = {
  /**
   * Fetch all active farmer clusters
   */
  async getClusters(): Promise<FarmerCluster[]> {
    try {
      // 1. Try Supabase
      const { data, error } = await supabase
        .from('farmer_clusters')
        .select(`
          *,
          cluster_inventory(*),
          cluster_members(*),
          bulk_buyer_matches(*),
          cluster_events(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any): FarmerCluster => ({
          id: row.id,
          name: row.name,
          commodity: row.commodity,
          centerPlace: row.center_place,
          centerDistrict: row.center_district || '',
          centerState: row.center_state || '',
          centerLat: Number(row.center_lat) || 17.0722,
          centerLng: Number(row.center_lng) || 78.2078,
          radiusKm: Number(row.radius_km) || 5.0,
          targetBulkKg: Number(row.target_bulk_kg) || 1000.0,
          currentQuantityKg: Number(row.current_quantity_kg) || 0,
          activeFarmersCount: Number(row.active_farmers_count) || 0,
          activeListingsCount: Number(row.active_listings_count) || 0,
          status: row.status,
          buyerMatchNotified: Boolean(row.buyer_match_notified),
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          inventory: (row.cluster_inventory || []).map((inv: any) => ({
            id: inv.id,
            clusterId: inv.cluster_id,
            produceId: inv.produce_id,
            farmerId: inv.farmer_id,
            farmerDisplayName: `Farmer (${inv.quality_grade || 'Grade A'})`,
            quantityKg: Number(inv.quantity_kg),
            cropName: inv.crop_name,
            qualityGrade: inv.quality_grade,
            askingPricePerKg: Number(inv.asking_price_per_kg),
            status: inv.status,
            createdAt: inv.created_at,
          })),
          matches: (row.bulk_buyer_matches || []).map((m: any) => ({
            id: m.id,
            clusterId: m.cluster_id,
            buyerId: m.buyer_id,
            buyerName: m.buyer_name,
            company: m.company,
            buyerType: m.buyer_type,
            offeredPricePerKg: Number(m.offered_price_per_kg),
            desiredQuantityKg: Number(m.desired_quantity_kg),
            matchScore: Number(m.match_score),
            destinationHub: m.destination_hub,
            distanceKm: Number(m.distance_km),
            pickupOffered: Boolean(m.pickup_offered),
            paymentTermsDays: Number(m.payment_terms_days),
            reliabilityRating: Number(m.reliability_rating),
            status: m.status,
            estimatedSharedSavingsPercent: 35,
            recommendedVehicle: 'Tata 407 Reefer',
            matchedAt: m.matched_at,
          })),
          events: (row.cluster_events || []).map((e: any) => ({
            id: e.id,
            clusterId: e.cluster_id,
            eventType: e.event_type,
            title: e.title,
            description: e.description,
            metadata: e.metadata,
            createdAt: e.created_at,
          })),
        }));
      }
    } catch {
      // Fallback to local
    }

    return getStoredClusters();
  },

  /**
   * Fetch single cluster by ID
   */
  async getClusterById(clusterId: string): Promise<FarmerCluster | null> {
    const all = await this.getClusters();
    return all.find((c) => c.id === clusterId) || null;
  },

  /**
   * Find nearby cluster within radius for a specific commodity
   */
  async findNearbyCluster(
    commodity: string,
    place: string,
    lat?: number,
    lng?: number,
    radiusKm: number = 5.0
  ): Promise<FarmerCluster | null> {
    const clusters = await this.getClusters();
    const cleanCrop = commodity.toLowerCase().trim();

    const targetCoords = lat && lng ? { lat, lng } : resolveCoordinates(place);

    for (const cluster of clusters) {
      const isSameCrop =
        cluster.commodity.toLowerCase().includes(cleanCrop) ||
        cleanCrop.includes(cluster.commodity.toLowerCase());

      if (isSameCrop) {
        const distance = calculateDistanceKm(
          targetCoords.lat,
          targetCoords.lng,
          cluster.centerLat,
          cluster.centerLng
        );

        if (distance <= (cluster.radiusKm || radiusKm)) {
          return cluster;
        }

        // String-based fallback match on location
        if (
          place &&
          cluster.centerPlace &&
          (cluster.centerPlace.toLowerCase().includes(place.toLowerCase()) ||
            place.toLowerCase().includes(cluster.centerPlace.toLowerCase()))
        ) {
          return cluster;
        }
      }
    }

    return null;
  },

  /**
   * Auto-Cluster Produce Listing:
   * Groups a farmer's listing into an existing nearby cluster or creates a new one
   */
  async autoClusterProduce(params: {
    farmerId: string;
    farmerName: string;
    farmerPlace?: string;
    farmerArea?: string;
    crop: string;
    quantityKg: number;
    qualityGrade?: string;
    expectedPrice?: number;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    targetBulkKg?: number;
  }): Promise<AutoClusterResult> {
    const {
      farmerId,
      farmerName,
      farmerPlace = 'Shadnagar',
      farmerArea = 'Agri Cluster',
      crop,
      quantityKg,
      qualityGrade = 'Grade A',
      expectedPrice = 28.0,
      radiusKm = 5.0,
      targetBulkKg = 1000.0,
    } = params;

    const coords = params.lat && params.lng ? { lat: params.lat, lng: params.lng } : resolveCoordinates(farmerPlace, farmerArea);
    const existing = await this.findNearbyCluster(crop, farmerPlace, coords.lat, coords.lng, radiusKm);

    const anonymizedName = farmerName.length > 2 
      ? `${farmerName.charAt(0)}. (${farmerArea || farmerPlace})`
      : `Farmer (${farmerArea || farmerPlace})`;

    const newInventoryItem: ClusterInventoryItem = {
      id: `inv-${Date.now()}`,
      clusterId: existing ? existing.id : `cluster-${Date.now()}`,
      farmerId,
      farmerDisplayName: anonymizedName,
      quantityKg,
      cropName: crop,
      qualityGrade,
      askingPricePerKg: expectedPrice,
      distanceFromCenterKm: existing
        ? calculateDistanceKm(coords.lat, coords.lng, existing.centerLat, existing.centerLng)
        : 0.5,
      status: 'Pledged',
      createdAt: new Date().toISOString(),
      isCurrentUser: true,
    };

    let targetCluster: FarmerCluster;
    let isNew = false;

    if (existing) {
      targetCluster = { ...existing };
      const currentInv = targetCluster.inventory || [];
      targetCluster.inventory = [...currentInv, newInventoryItem];
      targetCluster.activeListingsCount = targetCluster.inventory.length;
      targetCluster.currentQuantityKg = targetCluster.inventory.reduce((acc, i) => acc + i.quantityKg, 0);

      // Check unique farmers
      const uniqueFarmers = new Set(targetCluster.inventory.map((i) => i.farmerId));
      targetCluster.activeFarmersCount = uniqueFarmers.size;

      // Update bulk buyer matching status
      if (targetCluster.currentQuantityKg >= targetCluster.targetBulkKg) {
        targetCluster.status = 'Bulk Buyer Matching Active';

        // Auto-generate buyer matches if not yet matched
        if (!targetCluster.matches || targetCluster.matches.length === 0) {
          const matchedResults = matchBuyers(
            targetCluster.currentQuantityKg,
            expectedPrice,
            (qualityGrade as ProduceQualityGrade) || 'Grade A'
          );

          targetCluster.matches = matchedResults.slice(0, 3).map((br, idx) => ({
            id: `match-${Date.now()}-${idx}`,
            clusterId: targetCluster.id,
            buyerId: br.buyer.id,
            buyerName: br.buyer.name,
            company: br.buyer.company,
            buyerType: br.buyer.buyerType as any,
            offeredPricePerKg: br.buyer.offeredPricePerKg,
            desiredQuantityKg: br.buyer.desiredQuantityKg,
            matchScore: br.compositeScore,
            destinationHub: br.buyer.destinationHub,
            distanceKm: br.buyer.distanceKm,
            pickupOffered: br.buyer.pickupOffered,
            paymentTermsDays: br.buyer.paymentTermsDays,
            reliabilityRating: br.buyer.reliabilityRating,
            status: 'Proposed',
            estimatedSharedSavingsPercent: 35,
            recommendedVehicle: 'Tata 407 Reefer',
            matchedAt: new Date().toISOString(),
          }));
        }

        // Add threshold reached event
        const events = targetCluster.events || [];
        events.unshift({
          id: `evt-${Date.now()}`,
          clusterId: targetCluster.id,
          eventType: 'THRESHOLD_REACHED',
          title: `Bulk Threshold Met: ${targetCluster.currentQuantityKg.toLocaleString()} kg (${Math.round((targetCluster.currentQuantityKg / targetCluster.targetBulkKg) * 100)}%)`,
          description: `Your contribution of ${quantityKg.toLocaleString()} kg pushed the cluster over the ${targetCluster.targetBulkKg.toLocaleString()} kg bulk order threshold!`,
          metadata: {
            totalKg: targetCluster.currentQuantityKg,
            targetKg: targetCluster.targetBulkKg,
            farmerCount: targetCluster.activeFarmersCount,
          },
          createdAt: new Date().toISOString(),
        });
        targetCluster.events = events;
      }
    } else {
      isNew = true;
      const newClusterId = `cluster-${Date.now()}`;
      newInventoryItem.clusterId = newClusterId;

      targetCluster = {
        id: newClusterId,
        name: `${crop} Cluster — ${farmerPlace}`,
        commodity: crop,
        centerPlace: farmerPlace,
        centerDistrict: 'Ranga Reddy',
        centerState: 'Telangana',
        centerLat: coords.lat,
        centerLng: coords.lng,
        radiusKm,
        targetBulkKg,
        currentQuantityKg: quantityKg,
        activeFarmersCount: 1,
        activeListingsCount: 1,
        status: quantityKg >= targetBulkKg ? 'Bulk Buyer Matching Active' : 'Consolidating',
        buyerMatchNotified: quantityKg >= targetBulkKg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inventory: [newInventoryItem],
        members: [
          {
            id: `mem-${Date.now()}`,
            clusterId: newClusterId,
            farmerId,
            farmerName: anonymizedName,
            farmerArea,
            farmerPlace,
            role: 'lead',
            joinedAt: new Date().toISOString(),
            isCurrentUser: true,
          },
        ],
        matches: [],
        events: [
          {
            id: `evt-${Date.now()}`,
            clusterId: newClusterId,
            eventType: 'MEMBER_JOINED',
            title: 'Cluster Established',
            description: `Farmer founded ${crop} Cluster at ${farmerPlace} with ${quantityKg.toLocaleString()} kg initial volume.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }

    // Save to memory and localStorage
    const currentClusters = getStoredClusters();
    const updated = currentClusters.map((c) => (c.id === targetCluster.id ? targetCluster : c));
    if (isNew) updated.unshift(targetCluster);
    saveStoredClusters(updated);

    // Sync to Supabase in background
    try {
      if (isNew) {
        await supabase.from('farmer_clusters').insert({
          id: targetCluster.id,
          name: targetCluster.name,
          commodity: targetCluster.commodity,
          center_place: targetCluster.centerPlace,
          center_lat: targetCluster.centerLat,
          center_lng: targetCluster.centerLng,
          radius_km: targetCluster.radiusKm,
          target_bulk_kg: targetCluster.targetBulkKg,
          current_quantity_kg: targetCluster.currentQuantityKg,
          active_farmers_count: targetCluster.activeFarmersCount,
          active_listings_count: targetCluster.activeListingsCount,
          status: targetCluster.status,
        });
      } else {
        await supabase.from('farmer_clusters').update({
          current_quantity_kg: targetCluster.currentQuantityKg,
          active_farmers_count: targetCluster.activeFarmersCount,
          active_listings_count: targetCluster.activeListingsCount,
          status: targetCluster.status,
        }).eq('id', targetCluster.id);
      }
    } catch {
      // Keep local state
    }

    return {
      cluster: targetCluster,
      isNewCluster: isNew,
      message: isNew
        ? `Created new cooperative cluster: ${targetCluster.name}`
        : `Added ${quantityKg} kg to ${targetCluster.name} (${targetCluster.currentQuantityKg} kg total)`,
      newInventoryItem,
    };
  },

  /**
   * Find bulk buyers for a cluster
   */
  async findBulkBuyersForCluster(clusterId: string): Promise<BulkBuyerMatch[]> {
    const cluster = await this.getClusterById(clusterId);
    if (!cluster) return [];

    if (cluster.matches && cluster.matches.length > 0) {
      return cluster.matches;
    }

    const avgPrice =
      cluster.inventory && cluster.inventory.length > 0
        ? cluster.inventory.reduce((sum, i) => sum + i.askingPricePerKg, 0) / cluster.inventory.length
        : 28.0;

    const matched = matchBuyers(cluster.currentQuantityKg, avgPrice, 'Grade A');

    const matches: BulkBuyerMatch[] = matched.slice(0, 4).map((br, idx) => ({
      id: `match-${clusterId}-${idx}`,
      clusterId,
      buyerId: br.buyer.id,
      buyerName: br.buyer.name,
      company: br.buyer.company,
      buyerType: br.buyer.buyerType as any,
      offeredPricePerKg: br.buyer.offeredPricePerKg,
      desiredQuantityKg: br.buyer.desiredQuantityKg,
      matchScore: br.compositeScore,
      destinationHub: br.buyer.destinationHub,
      distanceKm: br.buyer.distanceKm,
      pickupOffered: br.buyer.pickupOffered,
      paymentTermsDays: br.buyer.paymentTermsDays,
      reliabilityRating: br.buyer.reliabilityRating,
      status: 'Proposed',
      estimatedSharedSavingsPercent: 35,
      recommendedVehicle: 'Tata 407 Reefer',
      matchedAt: new Date().toISOString(),
    }));

    cluster.matches = matches;
    const all = getStoredClusters().map((c) => (c.id === clusterId ? cluster : c));
    saveStoredClusters(all);

    return matches;
  },

  /**
   * Create a new cooperative cluster manually
   */
  async createCluster(params: {
    name: string;
    commodity: string;
    centerPlace: string;
    centerDistrict?: string;
    centerState?: string;
    radiusKm?: number;
    targetBulkKg?: number;
    creatorFarmerId?: string;
  }): Promise<FarmerCluster> {
    const {
      name,
      commodity,
      centerPlace,
      centerDistrict = 'Ranga Reddy',
      centerState = 'Telangana',
      radiusKm = 5.0,
      targetBulkKg = 1000.0,
      creatorFarmerId,
    } = params;

    const coords = resolveCoordinates(centerPlace);
    const newCluster: FarmerCluster = {
      id: `cluster-${Date.now()}`,
      name,
      commodity,
      centerPlace,
      centerDistrict,
      centerState,
      centerLat: coords.lat,
      centerLng: coords.lng,
      radiusKm,
      targetBulkKg,
      currentQuantityKg: 0,
      activeFarmersCount: creatorFarmerId ? 1 : 0,
      activeListingsCount: 0,
      status: 'Consolidating',
      buyerMatchNotified: false,
      createdBy: creatorFarmerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inventory: [],
      members: creatorFarmerId
        ? [
            {
              id: `mem-${Date.now()}`,
              clusterId: `cluster-${Date.now()}`,
              farmerId: creatorFarmerId,
              farmerName: 'Cluster Founder',
              farmerArea: centerPlace,
              farmerPlace: centerPlace,
              role: 'lead',
              joinedAt: new Date().toISOString(),
              isCurrentUser: true,
            },
          ]
        : [],
      matches: [],
      events: [
        {
          id: `evt-${Date.now()}`,
          clusterId: `cluster-${Date.now()}`,
          eventType: 'MEMBER_JOINED',
          title: 'Virtual Cooperative Formed',
          description: `Established ${name} with a ${radiusKm} km radius targeting ${targetBulkKg.toLocaleString()} kg.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const current = getStoredClusters();
    current.unshift(newCluster);
    saveStoredClusters(current);

    return newCluster;
  },
};
