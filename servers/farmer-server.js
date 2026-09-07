const express = require('express');
const cors = require('cors');
const { db } = require('./db');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const activeOtps = {};

app.get('/api/health', (req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'").get().count;
  res.json({
    status: 'online',
    server: 'AgriFlow Farmer Microservice',
    databaseEngine: 'SQLite3 (node:sqlite Binary Relational DB)',
    port: PORT,
    registeredFarmers: userCount,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/farmer/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  activeOtps[phone.trim()] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  console.log(`[FARMER-SVR 5001 : SQLITE] Generated OTP for ${phone}: ${otp}`);

  const spokenHindi = `नमस्ते किसान भाई, एग्रीफ्लो ऐप में आपका लॉगिन ओटीपी है: ${otp.split('').join(' ')}`;
  const spokenEnglish = `Welcome Kisan. Your AgriFlow verification code is: ${otp.split('').join(' ')}`;

  res.json({
    success: true,
    message: 'OTP sent via SMS & Voice Call',
    phone,
    otp,
    voicePrompt: { hindi: spokenHindi, english: spokenEnglish }
  });
});

app.post('/api/farmer/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const record = activeOtps[phone?.trim()];

  if (!record || record.otp !== otp?.trim() && otp !== '1234') {
    return res.status(401).json({ error: 'Invalid or expired OTP. Use demo OTP (1234) or request a new code.' });
  }

  let user = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND phone = ?").get(phone?.trim());
  if (!user) {
    const newId = `farmer-${Date.now()}`;
    const newKisanId = `KISAN-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO users (id, name, role, phone, pin, kisan_id, fpo, location, wallet_balance, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, 'Kisan Partner', 'farmer', phone, '1234', newKisanId, 'Maharashtra Agro Producer Co.', 'Nashik, Maharashtra', 50000.0, 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150');
    
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(newId);
  }

  delete activeOtps[phone?.trim()];

  res.json({
    success: true,
    token: `sql-token-farmer-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      kisanId: user.kisan_id,
      fpo: user.fpo,
      location: user.location,
      walletBalance: user.wallet_balance,
      avatar: user.avatar
    }
  });
});

app.post('/api/farmer/auth/qr-login', (req, res) => {
  const { kisanId } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND (kisan_id = ? OR id = ?)").get(kisanId, kisanId);

  if (!user) return res.status(404).json({ error: 'Kisan Green Card not registered in SQLite database.' });

  res.json({
    success: true,
    token: `sql-token-farmer-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      kisanId: user.kisan_id,
      fpo: user.fpo,
      location: user.location,
      walletBalance: user.wallet_balance,
      avatar: user.avatar
    }
  });
});

app.get('/api/farmer/crops', (req, res) => {
  const crops = db.prepare('SELECT * FROM crops').all();
  res.json({
    success: true,
    count: crops.length,
    crops: crops.map(c => ({
      id: c.id,
      name: c.name,
      variety: c.variety,
      category: c.category,
      farmer: c.farmer_name,
      location: c.location,
      stockTons: c.stock_tons,
      directPrice: c.direct_price,
      mandiPrice: c.mandi_price,
      farmerGain: c.farmer_gain,
      brix: c.brix,
      shelfLifeDays: c.shelf_life_days,
      ethylene: c.ethylene,
      reeferTemp: c.reefer_temp,
      humidity: c.humidity,
      badge: c.badge,
      image: c.image
    }))
  });
});

app.post('/api/farmer/schedule-pickup', (req, res) => {
  const { farmerName, phone, cropName, quantityTons, pickupSlot } = req.body;
  const newId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qTons = parseFloat(quantityTons) || 10.0;
  const price = 28.50;
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
    newId, cropName || 'Nashik Red Onion (Export Grade)', qTons, price, total, 0, 'Escrow Locked', 'amber',
    farmerName || 'Ramesh Patil', phone || '+91 98220 12345', 'KISAN-MH-7721', 'Lasalgaon Farm Gate', pickupSlot || 'Morning 07:00 AM',
    'BigBasket Institutional Sourcing', '+91 99001 12233', 'Innovative Retail Concepts Pvt Ltd', 'Bhiwandi Central Mega Hub, Bay 4', 'Scheduled Unloading',
    'MH-15-EG-8821', 'Suresh Mane', '+91 97661 23456', '+4.2 C', '68%', 'Assigned (En Route to Farm)', '2 hrs',
    'Dr. M. Swaminathan', 'AGRI-QC-NASHIK-01', 'Cold Chamber Bay 3', 'Awaiting Farm Gate Sample Arrival', `QC-2026-${Math.floor(1000 + Math.random() * 9000)}`, new Date().toISOString()
  );

  res.json({
    success: true,
    message: 'Pickup slot scheduled in SQLite database. Reefer truck MH-15-EG-8821 dispatched.',
    orderId: newId
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌾 AgriFlow FARMER Microservice [SQLite] on Port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});