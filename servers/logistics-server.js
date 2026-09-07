const express = require('express');
const cors = require('cors');
const { db } = require('./db');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    server: '🚛 AgriFlow Logistics & QC Microservice',
    port: PORT,
    database: 'SQLite3 (servers/agriflow.db)',
    endpoints: [
      'GET /api/logistics/telematics',
      'GET /api/logistics/orders/manifest',
      'POST /api/logistics/orders/:id/advance',
      'POST /api/logistics/orders/:id/reassign',
      'GET /api/logistics/qc-bays'
    ],
    timestamp: new Date().toISOString()
  });
});

// 1. Reefer Telematics
app.get('/api/logistics/telematics', (req, res) => {
  const jitterTemp = +(4.2 + (Math.random() * 0.4 - 0.2)).toFixed(2);
  const jitterSpeed = Math.floor(55 + Math.random() * 8);

  res.json({
    success: true,
    serverPort: PORT,
    telematics: {
      activeTruck: 'MH-15-EG-8821',
      driver: 'Suresh Mane',
      speedKmh: jitterSpeed,
      reeferTemp: jitterTemp,
      humidity: 68.4,
      currentWaypoint: 'Sinnar Bypass (NH-60)',
      destination: 'Bhiwandi Central Mega Hub',
      etaMinutes: 165,
      timestamp: new Date().toISOString()
    }
  });
});

// 2. Central 4-Way Assigned Manifest
app.get('/api/logistics/orders/manifest', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_date DESC').all();
  res.json({
    success: true,
    serverPort: PORT,
    count: orders.length,
    orders: orders.map(o => ({
      id: o.id,
      commodity: o.commodity,
      quantityTons: o.quantity_tons,
      pricePerKg: o.price_per_kg,
      totalValue: o.total_value,
      stageIndex: o.stage_index,
      stageName: o.stage_name,
      stageColor: o.stage_color,
      farmer: { name: o.farmer_name, phone: o.farmer_phone, kisanId: o.farmer_kisan_id, farm: o.farmer_farm, slot: o.farmer_slot },
      buyer: { name: o.buyer_name, phone: o.buyer_phone, company: o.buyer_company, depot: o.buyer_depot, slot: o.buyer_slot },
      logistics: { truckNo: o.truck_no, driver: o.driver_name, phone: o.driver_phone, temp: o.chamber_temp, humidity: o.humidity, status: o.logistics_status, eta: o.eta },
      qc: { officer: o.qc_officer, badge: o.qc_badge, bay: o.qc_bay, status: o.qc_status, certNo: o.qc_cert_no },
      createdDate: o.created_date
    }))
  });
});

// 3. 5-Stage Order Lifecycle Progression
app.post('/api/logistics/orders/:id/advance', (req, res) => {
  const orderId = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) return res.status(404).json({ error: 'Order not found in SQLite' });

  const stages = [
    { name: 'Escrow Locked', color: 'amber' },
    { name: 'QC Passed & Stamped', color: 'purple' },
    { name: 'Dispatched from Bay', color: 'indigo' },
    { name: 'Cold Transit (Live GPS)', color: 'blue' },
    { name: 'Paid & Settled (T+0)', color: 'emerald' }
  ];

  const nextIndex = (order.stage_index + 1) % stages.length;
  const nextStage = stages[nextIndex];

  db.prepare('UPDATE orders SET stage_index = ?, stage_name = ?, stage_color = ? WHERE id = ?')
    .run(nextIndex, nextStage.name, nextStage.color, orderId);

  if (nextIndex === 4) {
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE name = ?')
      .run(order.total_value, order.farmer_name);
    console.log(`[LOGISTICS-SVR 5003] Credited ₹${order.total_value} to farmer ${order.farmer_name}`);
  }

  res.json({
    success: true,
    serverPort: PORT,
    message: `Order ${orderId} advanced to stage: ${nextStage.name}`,
    stageIndex: nextIndex,
    stageName: nextStage.name
  });
});

// 4. Cold Storage Bays
app.get('/api/logistics/qc-bays', (req, res) => {
  res.json({
    success: true,
    serverPort: PORT,
    bays: [
      { id: 'BAY-1', name: 'Pre-Cooling Chamber A', temp: '+8.0 C', capacity: '50 Tons', status: 'Active (Pre-Cooling)' },
      { id: 'BAY-2', name: 'Controlled Atmosphere Bay', temp: '+2.0 C', capacity: '120 Tons', status: 'Active (Garwa Onions)' },
      { id: 'BAY-3', name: 'Export Rapid Chill Bay', temp: '+4.2 C', capacity: '80 Tons', status: 'Active (Live Loading)' },
      { id: 'BAY-4', name: 'Ripening Degreening Cell', temp: '+14.0 C', capacity: '40 Tons', status: 'Available' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚛 AgriFlow LOGISTICS & QC [SQLite] on Port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});