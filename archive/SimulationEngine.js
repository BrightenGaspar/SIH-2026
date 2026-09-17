/**
 * AgriFlow.ai - Phase 2: Real-Time Simulation Engine
 * Node.js / Express + WebSocket background service
 * Simulates real-time IoT refrigerated fleet telematics:
 * - GPS route interpolation (Zaheerabad -> Hyderabad, Nashik -> Hyderabad, etc.)
 * - Temperature random walk (normal 2°C–8°C)
 * - Controlled intentional temperature breach (>8°C) with debounced alerts
 * - WebSocket broadcasting to connected frontend dashboards
 * - REST API: GET /api/simulate/status
 */

const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.SIMULATION_PORT || 5001;
const DATA_FILE = path.join(__dirname, 'src', 'services', 'mockData', 'seededDemoData.json');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Load initial seeded shipments
let seededData = {};
try {
  if (fs.existsSync(DATA_FILE)) {
    seededData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
} catch (err) {
  console.error('[SimulationEngine] Error loading seeded data:', err.message);
}

// In-memory active simulation state
let activeShipments = (seededData.shipments || []).map((s) => ({
  ...s,
  route_progress: s.route_progress || 0.45,
  current_temp: s.current_temp || 5.2,
  humidity: s.humidity || 84,
  temp_history: [
    { time: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), temp: s.current_temp - 0.2 },
    { time: new Date(Date.now() - 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), temp: s.current_temp - 0.1 },
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), temp: s.current_temp },
  ],
}));

// Fallback demo shipment if no data file found
if (activeShipments.length === 0) {
  activeShipments = [
    {
      id: "TRK-CONS-ROAD-9021",
      trip_id: "TRIP-ROAD-9021",
      produce_name: "Fresh Hybrid Tomatoes (5,000 kg Bulk)",
      vehicle_type: "Tata 407 Reefer",
      vehicle_number: "TS 08 UB 4192",
      driver_name: "Mohammed Ismail",
      driver_phone: "+91 98480 22341",
      origin: "Zaheerabad FPO Cold Dock",
      destination: "Bowenpally Central Wholesale Yard, Hyderabad",
      current_lat: 17.5100,
      current_lng: 78.1500,
      current_temp: 5.4,
      target_temp: 6.0,
      humidity: 86,
      status: "IN TRANSIT",
      route_progress: 0.60,
      has_temperature_breach: false,
      spoilage_risk: "LOW",
      route_coordinates: [
        [17.6833, 77.6000], [17.6200, 77.7500], [17.5500, 77.9200],
        [17.5100, 78.1500], [17.4800, 78.3500], [17.4729, 78.4842]
      ],
      temp_history: [
        { time: "14:10:00", temp: 5.1 },
        { time: "14:10:30", temp: 5.3 },
        { time: "14:11:00", temp: 5.4 },
      ],
      last_updated_at: new Date().toISOString(),
    },
    {
      id: "TRK-BREACH-DEMO-9099",
      trip_id: "TRIP-BREACH-DEMO",
      produce_name: "Zaheerabad Premium Desi Tomatoes (Batch B-9)",
      vehicle_type: "Mahindra Bolero Maxi Reefer",
      vehicle_number: "TS 07 EA 8831",
      driver_name: "Vikram Rathore",
      driver_phone: "+91 98481 77192",
      origin: "Zaheerabad Central Hub",
      destination: "Shamshabad Urban Terminal, Hyderabad",
      current_lat: 17.3200,
      current_lng: 78.2800,
      current_temp: 8.8,
      target_temp: 6.0,
      humidity: 78,
      status: "IN TRANSIT",
      route_progress: 0.75,
      has_temperature_breach: true,
      spoilage_risk: "HIGH",
      route_coordinates: [
        [17.6833, 77.6000], [17.5600, 77.8500], [17.4200, 78.1000],
        [17.3200, 78.2800], [17.2403, 78.4294]
      ],
      temp_history: [
        { time: "14:10:00", temp: 7.2 },
        { time: "14:10:30", temp: 7.9 },
        { time: "14:11:00", temp: 8.8 },
      ],
      last_updated_at: new Date().toISOString(),
    }
  ];
}

// Alert debouncing state: records last alerted timestamp per shipment
const lastAlertTimestamps = {};

/**
 * Broadcast event to all active WebSocket clients
 */
function broadcast(payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Coordinate linear interpolation along route coordinates
 */
function interpolateCoordinate(coords, progress) {
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

/**
 * Core simulation tick: advances GPS, random-walks temperature, checks alerts
 */
function simulationTick() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  activeShipments = activeShipments.map((shipment) => {
    // 1. Advance route progress smoothly (loop between 0.15 and 0.95 for continuous demo)
    let newProgress = (shipment.route_progress || 0.4) + 0.015;
    if (newProgress > 0.95) newProgress = 0.20;

    const [newLat, newLng] = interpolateCoordinate(shipment.route_coordinates, newProgress);

    // 2. Random-walk temperature
    let newTemp;
    if (shipment.id === 'TRK-BREACH-DEMO-9099' || shipment.has_temperature_breach) {
      // Intentional breach shipment: hovers in warning/critical zone (8.4°C - 9.4°C)
      const delta = (Math.random() - 0.45) * 0.25;
      newTemp = Math.round((shipment.current_temp + delta) * 10) / 10;
      if (newTemp < 8.2) newTemp = 8.4;
      if (newTemp > 9.8) newTemp = 9.4;
    } else {
      // Normal refrigerated shipment: hovers strictly within 2.0°C - 7.5°C (around target 5-6°C)
      const delta = (Math.random() - 0.5) * 0.2;
      newTemp = Math.round((shipment.current_temp + delta) * 10) / 10;
      if (newTemp < 3.2) newTemp = 3.6;
      if (newTemp > 7.4) newTemp = 7.1;
    }

    // 3. Update humidity slightly
    const humidityDelta = Math.floor((Math.random() - 0.5) * 3);
    const newHumidity = Math.max(70, Math.min(95, shipment.humidity + humidityDelta));

    // 4. Update temperature history (keep last 15 points)
    const history = shipment.temp_history || [];
    history.push({ time: timeStr, temp: newTemp });
    if (history.length > 15) history.shift();

    // 5. Spoilage risk evaluation
    const isBreach = newTemp > 8.0;
    const spoilageRisk = newTemp > 9.0 ? 'CRITICAL' : isBreach ? 'HIGH' : 'LOW';

    // 6. Check for temperature breach alert (debounced every 30 seconds per shipment)
    if (isBreach) {
      const lastAlert = lastAlertTimestamps[shipment.id] || 0;
      if (now.getTime() - lastAlert > 30000) {
        lastAlertTimestamps[shipment.id] = now.getTime();
        broadcast({
          type: 'TEMPERATURE_ALERT',
          shipment_id: shipment.id,
          vehicle_number: shipment.vehicle_number,
          temperature: newTemp,
          target_temp: shipment.target_temp || 6.0,
          timestamp: now.toISOString(),
          location: `${shipment.origin} -> ${shipment.destination}`,
          current_coords: [newLat, newLng],
          severity: newTemp > 9.0 ? 'CRITICAL' : 'WARNING',
          message: `Temperature Breach Detected on Trip #${shipment.id}: ${newTemp}°C exceeds threshold (8.0°C)!`,
        });
        console.log(`[ALERT] Temp Breach broadcasted for ${shipment.id}: ${newTemp}°C`);
      }
    }

    return {
      ...shipment,
      current_lat: newLat,
      current_lng: newLng,
      current_temp: newTemp,
      humidity: newHumidity,
      route_progress: Math.round(newProgress * 1000) / 1000,
      has_temperature_breach: isBreach,
      spoilage_risk: spoilageRisk,
      temp_history: history,
      last_updated_at: now.toISOString(),
    };
  });

  // Broadcast routine state update to all WebSocket listeners
  broadcast({
    type: 'SHIPMENT_UPDATE',
    timestamp: now.toISOString(),
    shipments: activeShipments,
  });

  // Periodically persist to local sync file
  try {
    if (seededData && seededData.metadata) {
      seededData.shipments = activeShipments;
      seededData.metadata.last_simulated_at = now.toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(seededData, null, 2), 'utf-8');
    }
  } catch {
    // Non-critical file write error
  }
}

// ------------------------------------------------------------------------------
// REST API Endpoints
// ------------------------------------------------------------------------------

// 1. GET /api/simulate/status
app.get('/api/simulate/status', (req, res) => {
  const breachCount = activeShipments.filter((s) => s.has_temperature_breach).length;
  res.json({
    status: 'ONLINE',
    mode: 'SIMULATED_LIVE_DATA',
    total_active_trips: activeShipments.length,
    temperature_breaches: breachCount,
    last_updated_at: new Date().toISOString(),
    shipments: activeShipments,
  });
});

// 2. POST /api/simulate/trigger-breach (Trigger custom demo breach)
app.post('/api/simulate/trigger-breach', (req, res) => {
  const { shipmentId = 'TRK-CONS-ROAD-9021', temp = 9.4 } = req.body || {};
  const target = activeShipments.find((s) => s.id === shipmentId) || activeShipments[0];

  if (target) {
    target.current_temp = Number(temp);
    target.has_temperature_breach = true;
    target.spoilage_risk = 'HIGH';
    lastAlertTimestamps[target.id] = 0; // Reset debounce so alert fires immediately
    simulationTick();

    return res.json({
      success: true,
      message: `Triggered temperature breach on ${target.id} at ${temp}°C`,
      shipment: target,
    });
  }

  res.status(404).json({ error: 'Shipment not found' });
});

// 3. POST /api/simulate/reset (Reset back to normal temperature)
app.post('/api/simulate/reset', (req, res) => {
  activeShipments.forEach((s) => {
    s.current_temp = 5.2;
    s.has_temperature_breach = false;
    s.spoilage_risk = 'LOW';
  });
  simulationTick();
  res.json({ success: true, message: 'All shipments reset to nominal 5.2°C' });
});

// ------------------------------------------------------------------------------
// WebSocket Connection Handling
// ------------------------------------------------------------------------------
wss.on('connection', (ws) => {
  console.log('[SimulationEngine] Client connected to live telematics stream');
  // Send initial snapshot
  ws.send(JSON.stringify({
    type: 'INITIAL_SNAPSHOT',
    timestamp: new Date().toISOString(),
    shipments: activeShipments,
  }));

  ws.on('close', () => {
    console.log('[SimulationEngine] Client disconnected');
  });
});

// Start background 10-second simulation loop
const TICK_INTERVAL_MS = 10000;
setInterval(simulationTick, TICK_INTERVAL_MS);

// Start HTTP + WS Server
server.listen(PORT, () => {
  console.log('=' * 70);
  console.log(`[SimulationEngine] Phase 2: Live IoT Fleet Simulation Online`);
  console.log(`  - HTTP API: http://localhost:${PORT}/api/simulate/status`);
  console.log(`  - WebSocket: ws://localhost:${PORT}`);
  console.log(`  - Update Cycle: every 10s (GPS interpolation + Random-walk temp)`);
  console.log(`  - Intentional Breach Shipment: TRK-BREACH-DEMO-9099 (>8°C)`);
  console.log('=' * 70);
});
