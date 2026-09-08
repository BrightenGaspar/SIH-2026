import { DeliveryTracking } from '@/types/delivery';
import { apiClient, createLiveTrackingSocket } from '@/lib/apiClient';

export const mockDeliveryTrips: Record<string, DeliveryTracking> = {
  "TRK-CONS-ROAD-9021": {
    id: "TRK-CONS-ROAD-9021",
    tripId: "TRIP-HYD-7821",
    orderId: "ORD-HYD-5000",
    produceName: "Fresh Hybrid Tomatoes (Grade A - 5000kg Bulk)",
    totalQuantityKg: 5000,
    status: "IN TRANSIT",
    vehicleType: "Tata 407 Reefer",
    vehicleNumber: "TS 08 UB 4192",
    driverName: "Mohammed Ismail",
    driverPhone: "+91 98480 22341",
    pickupLocation: "Shadnagar FPO Hub, Rangareddy, Telangana",
    destinationLocation: "Bowenpally Central Wholesale Yard, Hyderabad",
    currentLocationName: "Shamshabad Outer Ring Road Tollway (NH 44)",
    currentCoordinates: [17.2403, 78.4294],
    pickupCoordinates: [17.0684, 78.2078],
    destinationCoordinates: [17.4729, 78.4842],
    estimatedArrival: "Today, 05:45 PM",
    distanceRemainingKm: 28,
    distanceCompletedKm: 46,
    totalDistanceKm: 74,
    progressPercentage: 68,
    etaMinutes: 45,
    telemetry: {
      temperatureCelsius: 5.8,
      targetTempCelsius: 6.0,
      humidityPercent: 86,
      safeWindowHours: 4,
      safeWindowMinutes: 30,
      spoilageRisk: "LOW",
      reeferActive: true,
      explanation: "Reefer active at optimal 5.8°C. Relative humidity calibrated at 86% to preserve tomato firmness and prevent transpiration."
    },
    returnLoad: {
      route: "Hyderabad Terminal → Warangal Produce Hub",
      commodity: "Organic Bio-Fertilizer Sacks & Seedlings",
      additionalEarnings: 2800,
      emptyDistanceAvoidedKm: 142
    },
    waypoints: [
      { id: "wp-1", title: "Harvest Loaded & Crated (3 Farmer Clusters)", location: "Shadnagar FPO Hub", coordinates: [17.0684, 78.2078], timestamp: "08:30 AM", completed: true },
      { id: "wp-2", title: "IoT Cold Seal & QR Verified", location: "Reefer Pre-Cool Gate", coordinates: [17.0800, 78.2200], timestamp: "09:15 AM", completed: true },
      { id: "wp-3", title: "Departed on NH 44 Expressway", location: "Kothur Toll Plaza", coordinates: [17.1500, 78.3000], timestamp: "10:00 AM", completed: true },
      { id: "wp-4", title: "In Transit — ORR Highway Corridor", location: "Shamshabad (Speed: 54 km/h • GPS Active)", coordinates: [17.2403, 78.4294], timestamp: "03:15 PM", completed: true, current: true },
      { id: "wp-5", title: "Entry into City Wholesale Hub", location: "Bowenpally Terminal Gate 4", coordinates: [17.4729, 78.4842], timestamp: "05:45 PM (ETA)", completed: false },
    ],
    routeCoordinates: [
      [17.0684, 78.2078],
      [17.1120, 78.2540],
      [17.1500, 78.3000],
      [17.1950, 78.3600],
      [17.2403, 78.4294],
      [17.3000, 78.4450],
      [17.3600, 78.4700],
      [17.4200, 78.4780],
      [17.4729, 78.4842]
    ],
    proofOfDelivery: {
      receivedBy: "K. Satyanarayana (Store Incharge)",
      timestamp: "Pending Arrival",
      verificationCode: "AGRI-9842",
      isVerified: false,
      notes: "Direct buyer terminal gate verification with geo-fenced OTP release"
    }
  },
  "TRK-RD-9021": {
    id: "TRK-RD-9021",
    tripId: "TRIP-GNT-4410",
    orderId: "ORD-CONS-801",
    produceName: "Guntur Hot Green Chillies (Grade A - 500kg)",
    totalQuantityKg: 500,
    status: "IN TRANSIT",
    vehicleType: "Mahindra Bolero Maxi Truck",
    vehicleNumber: "AP 07 TA 5519",
    driverName: "S. Nageswara Rao",
    driverPhone: "+91 94402 88190",
    pickupLocation: "Tenali Spice Market Hub, Guntur, AP",
    destinationLocation: "Mir Alam Mandi Spice Enclave, Hyderabad",
    currentLocationName: "Suryapet NH 65 Toll Bypass",
    currentCoordinates: [17.1439, 79.6239],
    pickupCoordinates: [16.2430, 80.6400],
    destinationCoordinates: [17.3616, 78.4747],
    estimatedArrival: "Today, 04:30 PM",
    distanceRemainingKm: 135,
    distanceCompletedKm: 155,
    totalDistanceKm: 290,
    progressPercentage: 54,
    etaMinutes: 110,
    telemetry: {
      temperatureCelsius: 8.2,
      targetTempCelsius: 8.0,
      humidityPercent: 78,
      safeWindowHours: 8,
      safeWindowMinutes: 0,
      spoilageRisk: "LOW",
      reeferActive: true,
      explanation: "Ventilated temperature control active at 8.2°C maintaining chilli snap and capsaicin integrity."
    },
    waypoints: [
      { id: "wp-g1", title: "Harvest Picked & Inspected", location: "Tenali Spice Mandi", coordinates: [16.2430, 80.6400], timestamp: "06:00 AM", completed: true },
      { id: "wp-g2", title: "Vijayawada Bypass Dispatch", location: "NH 65 Junction", coordinates: [16.5062, 80.6480], timestamp: "08:30 AM", completed: true },
      { id: "wp-g3", title: "Mid-Highway Checkpoint", location: "Suryapet Bypass", coordinates: [17.1439, 79.6239], timestamp: "01:30 PM", completed: true, current: true },
      { id: "wp-g4", title: "Hyderabad City Boundary", location: "L.B. Nagar Ring Entry", coordinates: [17.3457, 78.5522], timestamp: "03:45 PM (ETA)", completed: false },
      { id: "wp-g5", title: "Destination Unloading", location: "Mir Alam Mandi", coordinates: [17.3616, 78.4747], timestamp: "04:30 PM (ETA)", completed: false },
    ],
    routeCoordinates: [
      [16.2430, 80.6400],
      [16.5062, 80.6480],
      [16.8120, 80.2700],
      [17.1439, 79.6239],
      [17.2200, 79.1500],
      [17.3457, 78.5522],
      [17.3616, 78.4747]
    ]
  },
  "TRK-RD-8812": {
    id: "TRK-RD-8812",
    tripId: "TRIP-MDK-1002",
    orderId: "ORD-MED-102",
    produceName: "Nashik Premium Red Onions (Grade B - 3000kg)",
    totalQuantityKg: 3000,
    status: "DELIVERED",
    vehicleType: "Tata Ace",
    vehicleNumber: "TS 15 EA 9012",
    driverName: "B. Mallesh Yadav",
    driverPhone: "+91 97003 44102",
    pickupLocation: "Medak Rural FPO Aggregation Yard",
    destinationLocation: "Hitec City Catering Complex, Madhapur, Hyderabad",
    currentLocationName: "Hitec City Catering Terminal (Completed)",
    currentCoordinates: [17.4483, 78.3915],
    pickupCoordinates: [18.0450, 78.2630],
    destinationCoordinates: [17.4483, 78.3915],
    estimatedArrival: "Delivered (03:30 PM)",
    distanceRemainingKm: 0,
    distanceCompletedKm: 82,
    totalDistanceKm: 82,
    progressPercentage: 100,
    etaMinutes: 0,
    telemetry: {
      temperatureCelsius: 18.0,
      targetTempCelsius: 18.0,
      humidityPercent: 62,
      safeWindowHours: 24,
      safeWindowMinutes: 0,
      spoilageRisk: "LOW",
      reeferActive: false,
      explanation: "Delivered under optimal dry ambient transit. Zero moisture condensation."
    },
    waypoints: [
      { id: "wp-m1", title: "Bulk Crates Loaded", location: "Medak FPO Yard", coordinates: [18.0450, 78.2630], timestamp: "07:30 AM", completed: true },
      { id: "wp-m2", title: "Medak-Hyderabad Highway Entry", location: "Narsapur Cross", coordinates: [17.7400, 78.2800], timestamp: "09:00 AM", completed: true },
      { id: "wp-m3", title: "ORR Outer Ring Exit", location: "Gachibowli Junction", coordinates: [17.4400, 78.3500], timestamp: "01:15 PM", completed: true },
      { id: "wp-m4", title: "Consignment Delivered & Geo-Signed", location: "Madhapur Catering Hub", coordinates: [17.4483, 78.3915], timestamp: "03:30 PM", completed: true, current: true },
    ],
    routeCoordinates: [
      [18.0450, 78.2630],
      [17.7400, 78.2800],
      [17.5500, 78.3200],
      [17.4400, 78.3500],
      [17.4483, 78.3915]
    ],
    proofOfDelivery: {
      receivedBy: "Chef Anirudh Joshi (Head of Procurement)",
      timestamp: "Sep 07, 2026 - 03:30 PM",
      verificationCode: "POD-MDK-4482",
      isVerified: true,
      notes: "Crates verified: 3000kg Grade B Nashik Red Onions in prime condition."
    }
  }
};

export const defaultMockDeliveryTrip: DeliveryTracking = mockDeliveryTrips["TRK-CONS-ROAD-9021"];

export const sharedTrackingService = {
  async getAllTrips(): Promise<DeliveryTracking[]> {
    return Object.values(mockDeliveryTrips);
  },

  async getTracking(id: string): Promise<DeliveryTracking | null> {
    try {
      const data = await apiClient<DeliveryTracking>(`/api/tracking/${id}`, { method: 'GET' });
      return data;
    } catch {
      // Find matching mock trip by id, tripId, or orderId
      const cleanId = id.trim().toUpperCase();
      const match = Object.values(mockDeliveryTrips).find(
        (t) =>
          t.id.toUpperCase() === cleanId ||
          t.tripId.toUpperCase() === cleanId ||
          t.orderId.toUpperCase() === cleanId
      );

      if (match) return { ...match };

      return {
        ...defaultMockDeliveryTrip,
        id,
        tripId: id.includes("TRK") ? id : `TRK-${id}`,
      };
    }
  },

  async getTrackingByOrderId(orderId: string): Promise<DeliveryTracking | null> {
    try {
      const data = await apiClient<DeliveryTracking>(`/api/tracking/order/${orderId}`, { method: 'GET' });
      return data;
    } catch {
      const cleanOrder = orderId.trim().toUpperCase();
      const match = Object.values(mockDeliveryTrips).find(
        (t) => t.orderId.toUpperCase() === cleanOrder
      );

      if (match) return { ...match };

      return {
        ...defaultMockDeliveryTrip,
        orderId,
      };
    }
  },

  subscribe(tripId: string, onUpdate: (trip: DeliveryTracking) => void, onError?: (err: Event) => void): () => void {
    return createLiveTrackingSocket<DeliveryTracking>(tripId, onUpdate, onError);
  },
};

