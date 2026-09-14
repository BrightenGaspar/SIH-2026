import fs from 'fs';
import path from 'path';

export interface SimulatedShipment {
  id: string;
  trip_id: string;
  produce_name: string;
  vehicle_type: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  origin: string;
  destination: string;
  current_lat: number;
  current_lng: number;
  current_temp: number;
  target_temp: number;
  humidity: number;
  status: string;
  route_progress: number;
  has_temperature_breach: boolean;
  spoilage_risk: string;
  route_coordinates: [number, number][];
  temp_history: { time: string; temp: number }[];
  last_updated_at: string;
}

let inMemoryShipments: SimulatedShipment[] | null = null;
let lastTickTime = 0;

function interpolateCoordinate(coords: [number, number][], progress: number): [number, number] {
  if (!coords || coords.length === 0) return [17.2403, 78.4294];
  if (coords.length === 1) return coords[0];

  const totalSegments = coords.length - 1;
  const targetFloatIndex = progress * totalSegments;
  const baseIndex = Math.min(Math.floor(targetFloatIndex), totalSegments - 1);
  const segmentFraction = targetFloatIndex - baseIndex;

  const startPt = coords[baseIndex];
  const endPt = coords[baseIndex + 1];

  const lat = startPt[0] + (endPt[0] - startPt[0]) * segmentFraction;
  const lng = startPt[1] + (endPt[1] - startPt[1]) * segmentFraction;

  return [Math.round(lat * 100000) / 100000, Math.round(lng * 100000) / 100000];
}

function loadInitialShipments(): SimulatedShipment[] {
  return [];
}


export function getTickedSimulatedShipments(): SimulatedShipment[] {
  // Production mode: simulated state ticking is deactivated. Real telemetry comes from Supabase.
  return [];
}


export function triggerBreachInMemory(shipmentId?: string): SimulatedShipment | null {
  if (!inMemoryShipments) {
    inMemoryShipments = loadInitialShipments();
  }

  const target = shipmentId
    ? inMemoryShipments.find((s) => s.id === shipmentId)
    : inMemoryShipments[0];

  if (target) {
    target.current_temp = 9.8;
    target.has_temperature_breach = true;
    target.spoilage_risk = 'HIGH';
    if (!target.temp_history) target.temp_history = [];
    target.temp_history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temp: 9.8,
    });
    return target;
  }
  return null;
}

export function resetInMemory(shipmentId?: string): SimulatedShipment | null {
  if (!inMemoryShipments) {
    inMemoryShipments = loadInitialShipments();
  }

  const target = shipmentId
    ? inMemoryShipments.find((s) => s.id === shipmentId)
    : inMemoryShipments[0];

  if (target) {
    target.current_temp = 5.2;
    target.has_temperature_breach = false;
    target.spoilage_risk = 'LOW';
    if (!target.temp_history) target.temp_history = [];
    target.temp_history.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temp: 5.2,
    });
    return target;
  }
  return null;
}
