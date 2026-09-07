const express = require('express');
const cors = require('cors');
const { db } = require('./db');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    server: '🛒 AgriFlow Buyer Microservice',
    port: PORT,
    database: 'SQLite3 (servers/agriflow.db)',
    endpoints: [
      'POST /api/buyer/auth/login',
      'GET /api/buyer/catalog',
      'POST /api/buyer/orders/create',
      'GET /api/buyer/chamber-iot',
      'GET /api/buyer/invoices'
    ],
    timestamp: new Date().toISOString()
  });
});

// 1. Buyer Login
app.post('/api/buyer/auth/login', (req, res) => {
  const { phone, pin } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE role = 'buyer' AND (phone = ? OR pin = ?)").get(phone, pin) ||
               db.prepare("SELECT * FROM users WHERE id = 'buyer-1'").get();

  res.json({
    success: true,
    serverPort: PORT,
    token: `sql-token-buyer-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      depot: user.location,
      walletBalance: user.wallet_balance,
      avatar: user.avatar
    }
  });
});

// 2. Direct Sourcing Catalog
app.get('/api/buyer/catalog', (req, res) => {
  const { sortBy } = req.query;
  let query = 'SELECT * FROM crops';
  if (sortBy === 'price_asc') query += ' ORDER BY direct_price ASC';
  else if (sortBy === 'price_desc') query += ' ORDER BY direct_price DESC';
  else if (sortBy === 'shelflife') query += ' ORDER BY shelf_life_days DESC';

  const crops = db.prepare(query).all();
  res.json({
    success: true,
    serverPort: PORT,
    count: crops.length,
    catalog: crops.map(c => ({
      id: c.id,
      name: c.name,
      variety: c.variety,
      farmer: c.farmer_name,
      location: c.location,
      stockTons: c.stock_tons,
      directPrice: c.direct_price,
      mandiPrice: c.mandi_price,
      farmerGain: c.farmer_gain,
      brix: c.brix,
      shelfLifeDays: c.shelf_life_days,
      reeferTemp: c.reefer_temp,
      image: c.image
    }))
  });
});

// 3. Escrow Order Creation
app.post('/api/buyer/orders/create', (req, res) => {
  const { items, deliveryBay } = req.body;
  const created = [];

  (items || []).forEach(item => {
    const newId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qTons = item.quantityTons || 5.0;
    const price = item.pricePerKg || 28.50;
    const total = qTons * 1000 * price;

    db.prepare(`
      INSERT INTO orders (
        id, commodity, quantity_tons, price_per_kg, total_value, stage_index, stage_name, stage_color,
        farmer_name, farmer_phone, farmer_kisan_id, farmer_farm, farmer_slot,
        buyer_name, buyer_phone, buyer_company, buyer_depot, buyer_slot,
        truck_no, driver_name, driver_phone, chamber_temp, humidity, logistics_status, eta,
        qc_officer, qc_badge, qc_bay, qc_status, qc_cert_no, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId, item.name || 'Direct Sourced Batch', qTons, price, total, 0, 'Escrow Locked', 'amber',
      item.farmerName || 'Ramesh Patil', item.farmerPhone || '+91 98220 12345', 'KISAN-MH-7721', 'Lasalgaon Farm Gate', 'Immediate Reefer Slot',
      'BigBasket Institutional Sourcing', '+91 99001 12233', 'Innovative Retail Concepts Pvt Ltd', deliveryBay || 'Bhiwandi Central Bay 4', 'Tomorrow 08:00 AM',
      'MH-15-EG-8821', 'Suresh Mane', '+91 97661 23456', '+4.2 C', '68%', 'Assigned (Milk-Run En Route)', '3 hrs 30 mins',
      'Dr. M. Swaminathan', 'AGRI-QC-NASHIK-01', 'Cold Chamber Bay 3', 'Escrow Confirmed (ICICI Agri-Escrow)', `QC-2026-${Math.floor(1000 + Math.random() * 9000)}`, new Date().toISOString()
    );

    created.push({ id: newId, commodity: item.name, totalValue: total });
  });

  res.json({
    success: true,
    serverPort: PORT,
    message: `${created.length} smart contract escrow order(s) locked into SQLite.`,
    orders: created
  });
});

// 4. Chamber IoT Sensor Feeds
app.get('/api/buyer/chamber-iot', (req, res) => {
  res.json({
    success: true,
    serverPort: PORT,
    chamberId: 'CHAMBER-MMR-MEGA-04',
    temperatureCelsius: 4.1,
    targetTemp: 4.0,
    humidityPercent: 88.5,
    co2Ppm: 420,
    ethylenePpm: 0.06,
    spoilageRiskFactor: '0.02% (Ultra-Low)',
    powerBackupStatus: 'Active Solar Hybrid Online',
    capacityTons: 500,
    utilizedTons: 342.5
  });
});

// 5. Invoices
app.get('/api/buyer/invoices', (req, res) => {
  const orders = db.prepare("SELECT * FROM orders").all();
  res.json({
    success: true,
    serverPort: PORT,
    count: orders.length,
    invoices: orders.map(o => ({
      invoiceNo: `INV-${o.id}`,
      orderId: o.id,
      commodity: o.commodity,
      amount: o.total_value,
      gstin: '27AABCU9603R1ZM',
      status: o.stage_index === 4 ? 'Paid & Settled' : 'In Escrow'
    }))
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛒 AgriFlow BUYER Microservice [SQLite] on Port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});