import { DeliveryTracking } from '@/types/delivery';
import { apiClient, createLiveTrackingSocket } from '@/lib/apiClient';

export const defaultMockDeliveryTrip: DeliveryTracking = {
  id: "TRK-CONS-ROAD-9021",
  tripId: "TRIP-HYD-7821",
  orderId: "ORD-CONS-801",
  produceName: "Fresh Hybrid Tomatoes (Grade A - 2400kg)",
  totalQuantityKg: 2400,
  status: "IN TRANSIT",
  vehicleType: "Tata 407 Reefer",
  vehicleNumber: "TS 08 UB 4192",
  driverName: "Mohammed Ismail",
  driverPhone: "+91 98480 22341",
  pickupLocation: "Shadnagar FPO Hub, Telangana",
  destinationLocation: "Bowenpally Central Wholesale Yard, Hyderabad",
  currentLocationName: "Shamshabad Outer Ring Road Corridor",
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
    explanation: "Reefer cooling active at optimal 5.8°C. Relative humidity calibrated at 86% to prevent moisture transpiration."
  },
  returnLoad: {
    route: "Hyderabad Terminal → Warangal Produce Hub",
    commodity: "Organic Bio-Fertilizer Sacks & Seedlings",
    additionalEarnings: 2800,
    emptyDistanceAvoidedKm: 142
  },
  waypoints: [
    { id: "wp-1", title: "Harvest Loaded & Crated", location: "Shadnagar FPO Hub", coordinates: [17.0684, 78.2078], timestamp: "09:30 AM", completed: true },
    { id: "wp-2", title: "IoT Sensor Seal Calibrated", location: "Reefer Pre-Cool Gate", coordinates: [17.0800, 78.2200], timestamp: "10:00 AM", completed: true },
    { id: "wp-3", title: "Departed on NH 44 Highway", location: "Kothur Tollway", coordinates: [17.1500, 78.3000], timestamp: "10:45 AM", completed: true },
    { id: "wp-4", title: "In Transit — ORR Corridor", location: "Shamshabad (Speed: 54 km/h)", coordinates: [17.2403, 78.4294], timestamp: "03:15 PM", completed: true, current: true },
    { id: "wp-5", title: "Arrival & Inspection", location: "Bowenpally Wholesale Terminal", coordinates: [17.4729, 78.4842], timestamp: "05:45 PM (ETA)", completed: false },
  ],
  routeCoordinates: [
    [17.0684, 78.2078],
    [17.1500, 78.3000],
    [17.2403, 78.4294],
    [17.3600, 78.4700],
    [17.4729, 78.4842]
  ],
  proofOfDelivery: {
    receivedBy: "K. Satyanarayana (Store Incharge)",
    timestamp: "Pending",
    verificationCode: "AGRI-9842",
    isVerified: false,
    notes: "Direct gateway verification with geo-stamped OTP"
  }
};

export const sharedTrackingService = {
  async getTracking(id: string): Promise<DeliveryTracking | null> {
    try {
      const data = await apiClient<DeliveryTracking>(`/api/tracking/${id}`, { method: 'GET' });
      return data;
    } catch {
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
