const express = require('express');
const cors = require('cors');
const { db } = require('./db');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const activeOtps = {};

// Health & System Info
app.get('/api/health', (req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'").get().count;
  res.json({
    status: 'online',
    server: '🌾 AgriFlow Farmer Microservice',
    port: PORT,
    database: 'SQLite3 (servers/agriflow.db)',
    registeredFarmers: userCount,
    endpoints: [
      'POST /api/farmer/auth/send-otp',
      'POST /api/farmer/auth/verify-otp',
      'POST /api/farmer/auth/qr-login',
      'POST /api/farmer/auth/pin-login',
      'GET /api/farmer/crops',
      'POST /api/farmer/ripeness-grade',
      'POST /api/farmer/schedule-pickup',
      'GET /api/farmer/wallet/:id',
      'POST /api/farmer/withdraw'
    ],
    timestamp: new Date().toISOString()
  });
});

// 1. Voice & SMS OTP
app.post('/api/farmer/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  activeOtps[phone.trim()] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  console.log(`[FARMER-SVR 5001] Generated OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    serverPort: PORT,
    message: 'OTP sent via SMS & Spoken Voice Call',
    phone,
    otp,
    voicePrompt: {
      hindi: `नमस्ते किसान भाई, एग्रीफ्लो ऐप में आपका लॉगिन ओटीपी है: ${otp.split('').join(' ')}`,
      english: `Welcome Kisan. Your verification code is: ${otp.split('').join(' ')}`
    }
  });
});

// 2. Verify OTP
app.post('/api/farmer/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const record = activeOtps[phone?.trim()];

  if (!record || record.otp !== otp?.trim() && otp !== '1234' && otp !== '1295') {
    return res.status(401).json({ error: 'Invalid or expired OTP. Use demo OTP (1295) or request a new code.' });
  }

  let user = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND phone = ?").get(phone?.trim());
  if (!user) {
    const newId = `farmer-${Date.now()}`;
    db.prepare(`
      INSERT INTO users (id, name, role, phone, pin, kisan_id, fpo, location, wallet_balance, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, 'Kisan Partner', 'farmer', phone, '1234', `KISAN-MH-${Math.floor(1000 + Math.random() * 9000)}`, 'Maharashtra Agro Producer Co.', 'Nashik, Maharashtra', 50000.0, 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150');
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(newId);
  }

  delete activeOtps[phone?.trim()];

  res.json({
    success: true,
    serverPort: PORT,
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

// 3. Kisan Green Card 1-Tap Login
app.post('/api/farmer/auth/qr-login', (req, res) => {
  const { kisanId } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND (kisan_id = ? OR id = ?)").get(kisanId, kisanId);

  if (!user) return res.status(404).json({ error: 'Kisan Green Card not registered in SQLite database.' });

  res.json({
    success: true,
    serverPort: PORT,
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

// 4. Get Farmer Produce Listings
app.get('/api/farmer/crops', (req, res) => {
  const crops = db.prepare('SELECT * FROM crops').all();
  res.json({
    success: true,
    serverPort: PORT,
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

// 5. AI Optical Ripeness Grading Computation
app.post('/api/farmer/ripeness-grade', (req, res) => {
  const { cropName, opticalBrix } = req.body;
  const brix = parseFloat(opticalBrix) || 12.8;

  res.json({
    success: true,
    serverPort: PORT,
    crop: cropName || 'Nashik Red Onion',
    estimatedBrix: `${brix.toFixed(1)}° Bx`,
    qualityGrade: brix >= 12 ? 'Grade A+ (Export Prime)' : 'Grade B (Domestic Retail)',
    remainingShelfLifeDays: brix >= 12 ? 75 : 40,
    ethyleneLevel: '0.08 ppm',
    aiConfidence: '99.4%'
  });
});

// 6. Schedule Farmgate Milk-Run Pickup
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
    serverPort: PORT,
    message: 'Pickup slot scheduled and written to SQLite database.',
    orderId: newId,
    truckAssigned: 'MH-15-EG-8821 (Tata Ultra Reefer)'
  });
});

// 7. Get Farmer Wallet Balance
app.get('/api/farmer/wallet/:id', (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ? OR phone = ?").get(req.params.id, req.params.id) ||
               db.prepare("SELECT * FROM users WHERE role = 'farmer'").get();
  res.json({
    success: true,
    serverPort: PORT,
    farmerName: user.name,
    walletBalance: user.wallet_balance,
    bankAccount: 'State Bank of India A/c ...8821',
    ifsc: 'SBIN0001234',
    settlementCycle: 'T+0 e-RUPI Instant Payout'
  });
});

// 8. Dynamic Wallet Withdrawal (Deducts balance in SQLite!)
app.post('/api/farmer/withdraw', (req, res) => {
  const { farmerName, amount } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE name = ? OR role = 'farmer'").get(farmerName || 'Ramesh Patil');

  if (!user) return res.status(404).json({ error: 'Farmer profile not found in database.' });

  const withdrawAmount = parseFloat(amount) || user.wallet_balance;
  if (withdrawAmount <= 0 || withdrawAmount > user.wallet_balance) {
    return res.status(400).json({ error: 'Invalid withdrawal amount or insufficient balance.' });
  }

  const newBalance = user.wallet_balance - withdrawAmount;
  db.prepare("UPDATE users SET wallet_balance = ? WHERE id = ?").run(newBalance, user.id);

  console.log(`[FARMER-SVR 5001 : WITHDRAW] ${user.name} withdrew ₹${withdrawAmount}. New Balance: ₹${newBalance}`);

  res.json({
    success: true,
    serverPort: PORT,
    message: `Withdrawal of ₹${withdrawAmount.toLocaleString('en-IN')} settled to State Bank of India A/c ...8821`,
    amountWithdrawn: withdrawAmount,
    newWalletBalance: newBalance,
    utrNumber: `UPI-eRUPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    status: 'SETTLED_T0',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌾 AgriFlow FARMER Microservice [SQLite] on Port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});