const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, 'agriflow.db');
const db = new DatabaseSync(DB_FILE);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      kisan_id TEXT,
      fpo TEXT,
      location TEXT,
      wallet_balance REAL DEFAULT 0,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variety TEXT NOT NULL,
      category TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      location TEXT NOT NULL,
      stock_tons REAL NOT NULL,
      direct_price REAL NOT NULL,
      mandi_price REAL NOT NULL,
      farmer_gain TEXT NOT NULL,
      brix TEXT NOT NULL,
      shelf_life_days INTEGER NOT NULL,
      ethylene TEXT NOT NULL,
      reefer_temp TEXT NOT NULL,
      humidity TEXT NOT NULL,
      badge TEXT NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      commodity TEXT NOT NULL,
      quantity_tons REAL NOT NULL,
      price_per_kg REAL NOT NULL,
      total_value REAL NOT NULL,
      stage_index INTEGER NOT NULL DEFAULT 0,
      stage_name TEXT NOT NULL,
      stage_color TEXT NOT NULL,
      farmer_name TEXT NOT NULL,
      farmer_phone TEXT NOT NULL,
      farmer_kisan_id TEXT NOT NULL,
      farmer_farm TEXT NOT NULL,
      farmer_slot TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      buyer_company TEXT NOT NULL,
      buyer_depot TEXT NOT NULL,
      buyer_slot TEXT NOT NULL,
      truck_no TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      chamber_temp TEXT NOT NULL,
      humidity TEXT NOT NULL,
      logistics_status TEXT NOT NULL,
      eta TEXT NOT NULL,
      qc_officer TEXT NOT NULL,
      qc_badge TEXT NOT NULL,
      qc_bay TEXT NOT NULL,
      qc_status TEXT NOT NULL,
      qc_cert_no TEXT NOT NULL,
      created_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telematics_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_no TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      speed_kmh INTEGER NOT NULL,
      reefer_temp REAL NOT NULL,
      humidity REAL NOT NULL,
      current_waypoint TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    console.log('🌱 Seeding AgriFlow SQLite relational database (agriflow.db)...');

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, role, phone, pin, kisan_id, fpo, location, wallet_balance, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('farmer-1', 'Ramesh Patil', 'farmer', '9822012345', '1234', 'KISAN-MH-7721', 'Nashik Agro Producer Co.', 'Lasalgaon, Nashik, Maharashtra', 184500.0, 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150');
    insertUser.run('farmer-2', 'Sardar Balram Singh', 'farmer', '9814056789', '4321', 'KISAN-PB-3310', 'Malwa Farmer Producer Org', 'Khanna, Ludhiana, Punjab', 412000.0, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150');
    insertUser.run('farmer-3', 'Ananya Reddy', 'farmer', '9849087654', '9999', 'KISAN-AP-4402', 'Amaravati Krishi Sangham', 'Guntur, Andhra Pradesh', 265000.0, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
    insertUser.run('buyer-1', 'BigBasket Institutional Sourcing', 'buyer', '9900112233', '1111', 'BUYER-BB-01', 'Innovative Retail Concepts Pvt Ltd', 'Bhiwandi Central Mega Hub, Bay 4', 2500000.0, 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150');
    insertUser.run('buyer-2', 'Reliance Fresh Regional Sourcing', 'buyer', '9900445566', '2222', 'BUYER-RIL-02', 'Reliance Retail Ltd', 'Ghansoli Cold Logistics Depot, Bay 2', 4800000.0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
    insertUser.run('logistics-1', 'Suresh Mane', 'logistics', '9766123456', '8821', 'FLEET-MH-15', 'Reefer Express Logistics', 'Sinnar Bypass, NH-60', 32000.0, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150');
    insertUser.run('qc-1', 'Dr. M. Swaminathan', 'qc', '9444123456', '5555', 'AGRI-QC-NASHIK-01', 'Nashik Quality Control Board', 'Nashik Cold Bay 3', 75000.0, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    insertUser.run('admin-1', 'SIH Lead Architect', 'admin', '9999999999', '0000', 'ADMIN-SYS-01', 'AgriFlow Governance Core', 'Central Server Cloud', 10000000.0, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

    const insertCrop = db.prepare(`
      INSERT INTO crops (id, name, variety, category, farmer_name, location, stock_tons, direct_price, mandi_price, farmer_gain, brix, shelf_life_days, ethylene, reefer_temp, humidity, badge, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCrop.run('crop-1', 'Nashik Red Onion (Garwa)', 'Allium Cepa (Grade A+)', 'Allium Bulbs', 'Ramesh Patil', 'Nashik, Maharashtra', 24.5, 28.50, 17.80, '+60.1%', '12.8° Bx', 90, '0.08 ppm', '+2 to +4°C', '65-70%', 'Export Grade', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600');
    insertCrop.run('crop-2', 'Ratnagiri Alphonso Mango', 'Mangifera Indica (GI)', 'Tropical Stone Fruit', 'Sanjay Sawant', 'Ratnagiri, Maharashtra', 8.0, 145.00, 88.00, '+64.8%', '19.5° Bx', 14, '1.80 ppm', '+10 to +12°C', '85-90%', 'GI Certified', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600');
    insertCrop.run('crop-3', 'Jalgaon Cavendish Grand Naine Banana', 'Musa Acuminata AAA', 'Musaceae', 'Kishore Chaudhari', 'Jalgaon, Maharashtra', 38.0, 22.00, 13.50, '+63.0%', '21.0° Bx', 21, '1.40 ppm', '+13 to +14°C', '90-95%', 'Controlled Ripening', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600');
    insertCrop.run('crop-4', 'Sangli Seedless Thompson Grapes', 'Vitis Vinifera EuroGAP', 'Table Grapes', 'Nitin Shinde', 'Sangli, Maharashtra', 15.0, 78.00, 48.00, '+62.5%', '18.2° Bx', 45, '0.02 ppm', '-0.5 to 0°C', '90-95%', 'EuroGAP Certified', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600');
    insertCrop.run('crop-5', 'Solapur Bhagwa Pomegranate', 'Punica Granatum Deep Red', 'Aril Fruit', 'Ganesh Kadam', 'Solapur, Maharashtra', 18.5, 115.00, 72.00, '+59.7%', '16.4° Bx', 60, '0.05 ppm', '+5 to +6°C', '90-95%', 'Ruby Red Seeds', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600');
    insertCrop.run('crop-6', 'Pusa Ruby Polyhouse Tomatoes', 'Solanum Lycopersicum Firm', 'Nightshades', 'Sunita Jadhav', 'Pune, Maharashtra', 12.0, 32.00, 18.50, '+73.0%', '5.6° Bx', 18, '0.60 ppm', '+8 to +10°C', '85-90%', 'Polyhouse Fresh', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600');
    insertCrop.run('crop-7', 'Nagpur Mandarin Oranges', 'Citrus Reticulata Mrig', 'Citrus', 'Pravin Deshmukh', 'Nagpur, Maharashtra', 22.0, 46.00, 27.00, '+70.4%', '11.2° Bx', 30, '0.01 ppm', '+5 to +7°C', '85-90%', 'Sweet & Juicy', 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600');
    insertCrop.run('crop-8', 'Kufri Jyoti Processing Potatoes', 'Solanum Tuberosum Low Sugar', 'Tubers', 'Balram Singh', 'Ludhiana, Punjab', 45.0, 21.00, 13.00, '+61.5%', '3.8° Bx', 120, 'Sensitive', '+7 to +9°C', '90-95%', 'Cold-Cured', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600');

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, commodity, quantity_tons, price_per_kg, total_value, stage_index, stage_name, stage_color,
        farmer_name, farmer_phone, farmer_kisan_id, farmer_farm, farmer_slot,
        buyer_name, buyer_phone, buyer_company, buyer_depot, buyer_slot,
        truck_no, driver_name, driver_phone, chamber_temp, humidity, logistics_status, eta,
        qc_officer, qc_badge, qc_bay, qc_status, qc_cert_no, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      'ORD-2026-9901', 'Nashik Red Onion (Garwa Grade A+)', 14.5, 28.50, 413250.0, 3, 'Cold Transit', 'blue',
      'Ramesh Patil', '+91 98220 12345', 'KISAN-MH-7721', 'Lasalgaon Gate No. 4, Nashik', 'Today 06:30 AM (Completed)',
      'BigBasket Institutional Sourcing', '+91 99001 12233', 'Innovative Retail Concepts Pvt Ltd', 'Bhiwandi Central Mega Hub, Bay 4', 'Tonight 10:00 PM (Scheduled)',
      'MH-15-EG-8821', 'Suresh Mane', '+91 97661 23456', '+4.2 C', '68%', 'In-Transit (Sinnar Bypass, NH-60)', '4 hrs 15 mins',
      'Dr. M. Swaminathan', 'AGRI-QC-NASHIK-01', 'Cold Chamber Bay 3', 'Passed Grade A+ (Brix 12.8)', 'QC-2026-NASHIK-9901', '2026-09-07T05:00:00Z'
    );

    insertOrder.run(
      'ORD-2026-9902', 'Ratnagiri Alphonso Mango (GI)', 4.2, 145.00, 609000.0, 1, 'QC Inspection', 'amber',
      'Sanjay Sawant', '+91 98233 44556', 'KISAN-MH-8812', 'Devgad Orchard Block C, Ratnagiri', 'Today 08:00 AM (Loaded)',
      'Reliance Fresh Regional Hub', '+91 99004 45566', 'Reliance Retail Ltd', 'Ghansoli Cold Logistics Depot, Bay 2', 'Tomorrow 05:00 AM',
      'MH-08-AV-3344', 'Tanaji Gaikwad', '+91 98901 67890', '+10.8 C', '88%', 'Arrived at Kolhapur QC Hub', '12 hrs',
      'Er. Kavita Deshmukh', 'AGRI-QC-PUNE-04', 'Chamber Bay 1 (Pre-Cooling)', 'NIR Optical Scan in Progress (19.4 Bx)', 'QC-2026-KOLHAPUR-9902', '2026-09-07T07:15:00Z'
    );

    insertOrder.run(
      'ORD-2026-9903', 'Pusa Ruby Polyhouse Tomatoes', 8.0, 32.00, 256000.0, 4, 'Paid & Settled (T+0)', 'emerald',
      'Sunita Jadhav', '+91 98501 22334', 'KISAN-MH-4491', 'Khed Polyhouse Cluster 2, Pune', 'Yesterday 04:00 PM',
      'Swiggy Instamart Dark Stores', '+91 99887 76655', 'Bundl Technologies Pvt Ltd', 'Pune PCMC Fulfilment Center, Bay 1', 'Delivered Yesterday 11:30 PM',
      'MH-12-PQ-9009', 'Mahesh Shinde', '+91 98223 99887', '+8.4 C', '86%', 'Delivered & POD Signed', 'Completed',
      'Dr. Vikas Kulkarni', 'AGRI-QC-PUNE-09', 'Delivered Directly to Cold Dock', 'Accepted Grade A (Firmness 4.8 kg/cm2)', 'QC-2026-PUNE-9903', '2026-09-06T12:00:00Z'
    );

    console.log('✅ SQLite Database Seeded Successfully with 8 Users, 8 Crops, 3 Orders.');
  }
}

initDatabase();

module.exports = { db, initDatabase };