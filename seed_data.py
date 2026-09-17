#!/usr/bin/env python3
"""
AgriFlow.ai - Realistic Database Seeder
Seeds realistic Indian agricultural data:
- ~50 farmer profiles
- ~20 FPOs / cooperative clusters
- ~100 active crop lots
- ~10 active cold-chain logistics trips (with normal 2-8°C temp walk & 1 intentional breach)
- Deterministic verification hashes for traceability
- Saves to Supabase (if online) and syncs to src/services/mockData/seededDemoData.json
"""

import os
import sys
import json
import random
import hashlib
from datetime import datetime, timedelta
import urllib.request
import urllib.error

# Read credentials from .env.local
def load_env_local():
    env_file = os.path.join(os.path.dirname(__file__), '.env.local')
    config = {}
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    config[k.strip()] = v.strip().strip('"').strip("'")
    return config

ENV_CONFIG = load_env_local()
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', ENV_CONFIG.get('NEXT_PUBLIC_SUPABASE_URL', ''))
SUPABASE_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', ENV_CONFIG.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''))

# ------------------------------------------------------------------------------
# Regional Indian Agri Data Templates
# ------------------------------------------------------------------------------
REGIONAL_CLUSTERS = [
    {
        "fpo": "Zaheerabad Organic Farmer Producer Company",
        "commodity": "Tomato (Hybrid Desi)",
        "place": "Zaheerabad",
        "district": "Sangareddy",
        "state": "Telangana",
        "center_lat": 17.6833,
        "center_lng": 77.6000,
        "dest_market": "Bowenpally Wholesale Terminal, Hyderabad",
        "dest_lat": 17.4729,
        "dest_lng": 78.4842,
        "varieties": ["US-440 Hybrid Desi", "Abhinav F1", "Arka Rakshak"],
        "price_range": (38.0, 52.0),
        "typical_yield_range": (800, 3500),
    },
    {
        "fpo": "Nashik Valley Fresh Agro Producer Co-op",
        "commodity": "Onion (Nashik Red)",
        "place": "Nashik",
        "district": "Nashik",
        "state": "Maharashtra",
        "center_lat": 19.9975,
        "center_lng": 73.7898,
        "dest_market": "Hyderabad Central Mandi",
        "dest_lat": 17.3850,
        "dest_lng": 78.4867,
        "varieties": ["Garwa Red", "Pusa Red", "Bhima Super"],
        "price_range": (24.0, 38.0),
        "typical_yield_range": (2000, 8000),
    },
    {
        "fpo": "Guntur Mirchi Rythu Producer Syndicate",
        "commodity": "Green Chilli (G4)",
        "place": "Guntur",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "center_lat": 16.3067,
        "center_lng": 80.4365,
        "dest_market": "Mir Alam Mandi Spice Enclave, Hyderabad",
        "dest_lat": 17.3616,
        "dest_lng": 78.4747,
        "varieties": ["G4 Teja", "Byadgi Selection", "Armoor Hot"],
        "price_range": (42.0, 68.0),
        "typical_yield_range": (500, 2500),
    },
    {
        "fpo": "Warangal Agro Cotton & Chilli Producer Collective",
        "commodity": "Cotton & Turmeric",
        "place": "Warangal",
        "district": "Warangal",
        "state": "Telangana",
        "center_lat": 17.9689,
        "center_lng": 79.5941,
        "dest_market": "Hyderabad Agro Industrial Park",
        "dest_lat": 17.4000,
        "dest_lng": 78.4800,
        "varieties": ["Bt-II Hybrid", "Prathama Spices", "Sel-21"],
        "price_range": (55.0, 85.0),
        "typical_yield_range": (1200, 4500),
    },
    {
        "fpo": "Nizamabad Golden Turmeric Producer Society",
        "commodity": "Turmeric (Waigaon/Salem)",
        "place": "Nizamabad",
        "district": "Nizamabad",
        "state": "Telangana",
        "center_lat": 18.6725,
        "center_lng": 78.0941,
        "dest_market": "Begum Bazar Commercial Spice Terminal, Hyderabad",
        "dest_lat": 17.3750,
        "dest_lng": 78.4700,
        "varieties": ["Armoor Super", "Pragati 5.2% Curcumin", "Salem"],
        "price_range": (72.0, 110.0),
        "typical_yield_range": (800, 3000),
    },
    {
        "fpo": "Shadnagar Peri-Urban Perishable Hub",
        "commodity": "Tomato (Hybrid Desi)",
        "place": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "center_lat": 17.0722,
        "center_lng": 78.2078,
        "dest_market": "Bowenpally Wholesale Terminal, Hyderabad",
        "dest_lat": 17.4729,
        "dest_lng": 78.4842,
        "varieties": ["US-440 Hybrid Desi", "Dev Hybrid", "Lakshmi"],
        "price_range": (35.0, 50.0),
        "typical_yield_range": (600, 3200),
    },
    {
        "fpo": "Chevella Vegetable Growers Consortium",
        "commodity": "Potato (Jyoti)",
        "place": "Chevella",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "center_lat": 17.3080,
        "center_lng": 78.1360,
        "dest_market": "Gudimalkapur Wholesale Market, Hyderabad",
        "dest_lat": 17.3820,
        "dest_lng": 78.4350,
        "varieties": ["Kufri Jyoti", "Kufri Pukhraj", "Chipsona-1"],
        "price_range": (16.0, 26.0),
        "typical_yield_range": (1500, 6000),
    },
    {
        "fpo": "Agra Cold Storage Potato Union",
        "commodity": "Potato (Jyoti)",
        "place": "Agra",
        "district": "Agra",
        "state": "Uttar Pradesh",
        "center_lat": 27.1767,
        "center_lng": 78.0081,
        "dest_market": "Delhi Azadpur APMC / Kanpur Wholesale",
        "dest_lat": 28.7166,
        "dest_lng": 77.1720,
        "varieties": ["Kufri Badshah", "Kufri Bahar", "Jyoti Gold"],
        "price_range": (14.0, 22.0),
        "typical_yield_range": (3000, 12000),
    },
]

FIRST_NAMES = [
    "Ramesh", "Suresh", "Venkat", "Kishan", "Mallesh", "Anand", "Satyanarayana", "Naresh",
    "Ramulu", "Narsimha", "Praveen", "Mahesh", "Chandrasekhar", "Gopal", "Laxman", "Deva",
    "Balram", "Shivaji", "Tukaram", "Pandurang", "Eknath", "Babu", "Venkatesh", "Raja",
    "Subba", "Srinivas", "Raghavendra", "Anjaneyulu", "Koti", "Madhav", "Shankar", "Vishnu",
    "Bhanu", "Giridhar", "Damodar", "Kishore", "Suryanarayana", "Prabhakar", "Bhaskar", "Dharma"
]

LAST_NAMES = [
    "Reddy", "Patel", "Goud", "Yadav", "Rao", "Chowdary", "Shinde", "Patil",
    "Kulkarni", "Sharma", "Varma", "Mane", "Gaikwad", "Babu", "Naidu", "Joshi",
    "Kaur", "Singh", "Kumar", "Thakur"
]

def generate_demo_hash(seed_str: str) -> str:
    """Generate deterministic SHA-256 demo verification hash."""
    h = hashlib.sha256(seed_str.encode('utf-8')).hexdigest()
    return f"0x{h[:24]}"

def run_seeder():
    print("=" * 70)
    print("AgriFlow.ai - Phase 1: Fake Live Database Seeder")
    print("=" * 70)
    
    random.seed(42) # Deterministic for idempotent testing

    # 1. Generate ~50 Farmer Profiles
    print("\n1. Generating 50 Farmer Profiles...")
    farmers = []
    for i in range(50):
        cluster = REGIONAL_CLUSTERS[i % len(REGIONAL_CLUSTERS)]
        fn = FIRST_NAMES[i % len(FIRST_NAMES)]
        ln = LAST_NAMES[(i * 3 + 7) % len(LAST_NAMES)]
        full_name = f"{fn} {ln}"
        phone = f"+91 {random.randint(94000, 98999)} {random.randint(10000, 99999)}"
        farmer_id = f"frm-demo-{1000 + i}"
        
        # Slight coordinate jitter within ~3 km radius
        lat_offset = random.uniform(-0.025, 0.025)
        lng_offset = random.uniform(-0.025, 0.025)

        farmer = {
            "id": farmer_id,
            "full_name": full_name,
            "username": f"{fn.lower()}_{ln.lower()}_{100 + i}",
            "role": "farmer",
            "phone": phone,
            "email": f"{fn.lower()}.farm{100 + i}@agriflow.demo",
            "place": cluster["place"],
            "area": f"{cluster['place']} Rural Sector {1 + (i % 4)}",
            "district": cluster["district"],
            "state": cluster["state"],
            "fpo_name": cluster["fpo"],
            "latitude": round(cluster["center_lat"] + lat_offset, 5),
            "longitude": round(cluster["center_lng"] + lng_offset, 5),
            "is_demo_data": True,
            "created_at": (datetime.now() - timedelta(days=random.randint(10, 60))).isoformat(),
        }
        farmers.append(farmer)

    # 2. Generate 20 FPO / Cooperative Clusters
    print("2. Generating 20 Cooperative Clusters...")
    fpo_clusters = []
    commodities = ["Tomato (Hybrid Desi)", "Onion (Nashik Red)", "Green Chilli (G4)", "Potato (Jyoti)", "Turmeric"]
    places = ["Zaheerabad", "Shadnagar", "Nashik", "Guntur", "Warangal", "Nizamabad", "Chevella", "Kothur", "Shamshabad", "Farooqnagar"]
    
    for i in range(20):
        comm = commodities[i % len(commodities)]
        place = places[i % len(places)]
        ref = next((c for c in REGIONAL_CLUSTERS if c["place"].lower() == place.lower()), REGIONAL_CLUSTERS[0])
        cid = f"cluster-demo-{200 + i}"
        
        target_kg = 1000.0 if (i % 3 != 0) else 1500.0
        # Make some clusters above 1,000 kg and ready, some consolidating
        is_ready = (i % 2 == 0)
        curr_kg = round(target_kg * random.uniform(1.05, 1.45), 1) if is_ready else round(target_kg * random.uniform(0.40, 0.85), 1)
        
        cluster_record = {
            "id": cid,
            "name": f"{comm.split(' ')[0]} Cluster — {place}",
            "commodity": comm,
            "center_place": place,
            "center_district": ref["district"],
            "center_state": ref["state"],
            "center_lat": ref["center_lat"],
            "center_lng": ref["center_lng"],
            "radius_km": 5.0,
            "target_bulk_kg": target_kg,
            "current_quantity_kg": curr_kg,
            "active_farmers_count": random.randint(3, 12),
            "active_listings_count": random.randint(3, 8),
            "status": "Bulk Buyer Matching Active" if curr_kg >= target_kg else "Consolidating",
            "buyer_match_notified": is_ready,
            "is_demo_data": True,
            "created_at": (datetime.now() - timedelta(days=random.randint(5, 25))).isoformat(),
        }
        fpo_clusters.append(cluster_record)

    # 3. Generate 100 Active Crop Lots
    print("3. Generating 100 Active Crop Lots...")
    crop_lots = []
    grades = ["Grade A", "Grade A", "Grade B", "Grade B", "Grade C"]
    statuses = ["Active", "Active", "Active", "Reserved", "Sold"]
    base_date = datetime.now()

    for i in range(100):
        farmer = farmers[i % len(farmers)]
        cluster_ref = next((c for c in REGIONAL_CLUSTERS if c["place"] == farmer["place"]), REGIONAL_CLUSTERS[0])
        lot_id = f"LOT-2026-{7000 + i}"
        variety = random.choice(cluster_ref["varieties"])
        harvest_days_ago = random.randint(1, 8)
        harvest_date = (base_date - timedelta(days=harvest_days_ago)).strftime('%Y-%m-%d')
        
        est_yield = random.randint(*cluster_ref["typical_yield_range"])
        avail_kg = round(est_yield * random.uniform(0.6, 0.95), 0)
        p_min, p_max = cluster_ref["price_range"]
        price = round(random.uniform(p_min, p_max), 2)
        grade = random.choice(grades)
        
        lot = {
            "id": f"prod-demo-{3000 + i}",
            "lot_id": lot_id,
            "farmer_id": farmer["id"],
            "farmer_name": farmer["full_name"],
            "crop": cluster_ref["commodity"],
            "variety": variety,
            "harvest_date": harvest_date,
            "estimated_yield_kg": est_yield,
            "available_quantity_kg": avail_kg,
            "quality_grade": grade,
            "origin_place": farmer["place"],
            "destination_market": cluster_ref["dest_market"],
            "location_lat": farmer["latitude"],
            "location_long": farmer["longitude"],
            "current_market_price_per_kg": price,
            "asking_price": price,
            "status": random.choice(statuses),
            "is_demo_data": True,
            "created_at": (base_date - timedelta(days=harvest_days_ago)).isoformat(),
            "updated_at": base_date.isoformat(),
        }
        crop_lots.append(lot)

    # 4. Generate 10 Active Logistics Shipments / Trips
    # With normal 2-8°C random-walk temperature and 1 intentional breach!
    print("4. Generating 10 Active Logistics Trips (Reefer Cold-Chain with Intentional Breach Scenario)...")
    shipments = []
    routes = [
        {
            "id": "TRK-CONS-ROAD-9021",
            "name": "Tomato (Hybrid Desi) - 5,000 kg Consignment",
            "vehicle": "Tata 407 Reefer",
            "number": "TS 08 UB 4192",
            "driver": "Mohammed Ismail",
            "phone": "+91 98480 22341",
            "origin": "Zaheerabad FPO Cold Dock, Telangana",
            "destination": "Bowenpally Central Wholesale Yard, Hyderabad",
            "route_coords": [
                [17.6833, 77.6000], [17.6200, 77.7500], [17.5500, 77.9200],
                [17.5100, 78.1500], [17.4800, 78.3500], [17.4729, 78.4842]
            ],
            "temp_start": 5.2,
            "target_temp": 6.0,
            "is_breach": False,
        },
        {
            "id": "TRK-BREACH-DEMO-9099", # INTENTIONAL DEMO TEMPERATURE BREACH SHIPMENT
            "name": "Zaheerabad Premium Desi Tomatoes (Batch B-9)",
            "vehicle": "Mahindra Bolero Maxi Reefer",
            "number": "TS 07 EA 8831",
            "driver": "Vikram Rathore",
            "phone": "+91 98481 77192",
            "origin": "Zaheerabad Central Hub",
            "destination": "Shamshabad Urban Terminal, Hyderabad",
            "route_coords": [
                [17.6833, 77.6000], [17.5600, 77.8500], [17.4200, 78.1000],
                [17.3200, 78.2800], [17.2403, 78.4294]
            ],
            "temp_start": 8.7, # BREACH: Above 8.0°C!
            "target_temp": 6.0,
            "is_breach": True,
        },
        {
            "id": "TRK-NSK-HYD-9023",
            "name": "Nashik Red Onion (Export Grade) - 8,000 kg",
            "vehicle": "Eicher Pro 12-Ton Reefer",
            "number": "MH 15 DC 7812",
            "driver": "Suresh Shinde",
            "phone": "+91 98221 44551",
            "origin": "Lasalgaon Mandi, Nashik, Maharashtra",
            "destination": "Hyderabad Central Terminal",
            "route_coords": [
                [19.9975, 73.7898], [19.2000, 74.8000], [18.5000, 76.2000],
                [17.8000, 77.5000], [17.3850, 78.4867]
            ],
            "temp_start": 4.6,
            "target_temp": 4.0,
            "is_breach": False,
        },
        {
            "id": "TRK-RD-9021",
            "name": "Guntur Hot Green Chillies - 1,500 kg",
            "vehicle": "Tata Ace XL Cold Carrier",
            "number": "AP 07 TA 5519",
            "driver": "S. Nageswara Rao",
            "phone": "+91 94402 88190",
            "origin": "Tenali Market Hub, Guntur",
            "destination": "Mir Alam Mandi, Hyderabad",
            "route_coords": [
                [16.3067, 80.4365], [16.8000, 80.0000], [17.1439, 79.6239],
                [17.2500, 78.9000], [17.3616, 78.4747]
            ],
            "temp_start": 7.4,
            "target_temp": 8.0,
            "is_breach": False,
        },
        {
            "id": "TRK-WGL-HYD-9025",
            "name": "Warangal Organic Turmeric & Seeds - 3,200 kg",
            "vehicle": "Ashok Leyland Dost Reefer",
            "number": "TS 03 UA 6621",
            "driver": "K. Prabhakar",
            "phone": "+91 99881 22334",
            "origin": "Warangal Agro Cold Collection",
            "destination": "Hyderabad Agro Industrial Park",
            "route_coords": [
                [17.9689, 79.5941], [17.7500, 79.1500], [17.5500, 78.8000],
                [17.4000, 78.4800]
            ],
            "temp_start": 5.8,
            "target_temp": 6.0,
            "is_breach": False,
        },
        {
            "id": "TRK-SHD-HYD-9026",
            "name": "Shadnagar Cluster Farmgate Tomatoes - 1,100 kg",
            "vehicle": "Tata 407 Reefer",
            "number": "TS 08 UB 4491",
            "driver": "Rameshwar Rao",
            "phone": "+91 98490 11223",
            "origin": "Shadnagar Virtual Cooperative Hub",
            "destination": "Reliance Fresh Shamshabad DC",
            "route_coords": [
                [17.0722, 78.2078], [17.1500, 78.2800], [17.2403, 78.4294]
            ],
            "temp_start": 5.4,
            "target_temp": 6.0,
            "is_breach": False,
        },
        {
            "id": "TRK-NZB-HYD-9027",
            "name": "Nizamabad Curcumin Turmeric Crated - 2,400 kg",
            "vehicle": "Mahindra Bolero Maxi Truck",
            "number": "TS 16 EA 3391",
            "driver": "Anand Reddy",
            "phone": "+91 97011 88223",
            "origin": "Nizamabad Golden Turmeric Yard",
            "destination": "Begum Bazar Terminal, Hyderabad",
            "route_coords": [
                [18.6725, 78.0941], [18.2000, 78.2500], [17.8000, 78.4000],
                [17.3750, 78.4700]
            ],
            "temp_start": 6.1,
            "target_temp": 6.5,
            "is_breach": False,
        },
        {
            "id": "TRK-CHV-HYD-9028",
            "name": "Chevella Jyoti Potatoes - 4,000 kg",
            "vehicle": "Eicher Pro Reefer",
            "number": "TS 07 UB 9912",
            "driver": "B. Narsimha",
            "phone": "+91 98661 55443",
            "origin": "Chevella Vegetable Packhouse",
            "destination": "Gudimalkapur Wholesale Hub",
            "route_coords": [
                [17.3080, 78.1360], [17.3400, 78.2800], [17.3820, 78.4350]
            ],
            "temp_start": 6.8,
            "target_temp": 7.0,
            "is_breach": False,
        },
        {
            "id": "TRK-AGR-DEL-9029",
            "name": "Agra Cold Vault Jyoti Potatoes - 10,000 kg",
            "vehicle": "BharatBenz 16-Ton Insulated Truck",
            "number": "UP 80 BT 4410",
            "driver": "Gurpreet Singh",
            "phone": "+91 98110 33445",
            "origin": "Agra Cold Storage Vault #4",
            "destination": "Azadpur APMC Terminal, Delhi",
            "route_coords": [
                [27.1767, 78.0081], [27.6000, 77.8000], [28.2000, 77.4000],
                [28.7166, 77.1720]
            ],
            "temp_start": 5.9,
            "target_temp": 6.0,
            "is_breach": False,
        },
        {
            "id": "TRK-KTR-HYD-9030",
            "name": "Kothur Agro Fresh Chillies - 1,200 kg",
            "vehicle": "Tata Ace Reefer",
            "number": "TS 08 EA 5521",
            "driver": "M. Yadaiah",
            "phone": "+91 98482 11990",
            "origin": "Kothur Farmers Collective",
            "destination": "Bowenpally Wholesale Terminal",
            "route_coords": [
                [17.1472, 78.2891], [17.2500, 78.3600], [17.4729, 78.4842]
            ],
            "temp_start": 7.1,
            "target_temp": 7.5,
            "is_breach": False,
        },
    ]

    for r in routes:
        # Start at approx 40-70% progress along route
        progress = 0.55
        coords_list = r["route_coords"]
        curr_idx = int(len(coords_list) * progress)
        curr_pt = coords_list[min(curr_idx, len(coords_list) - 1)]

        shipment = {
            "id": r["id"],
            "trip_id": f"TRIP-{r['id'].replace('TRK-', '')}",
            "produce_name": r["name"],
            "vehicle_type": r["vehicle"],
            "vehicle_number": r["number"],
            "driver_name": r["driver"],
            "driver_phone": r["phone"],
            "origin": r["origin"],
            "destination": r["destination"],
            "current_lat": curr_pt[0],
            "current_lng": curr_pt[1],
            "current_temp": r["temp_start"],
            "target_temp": r["target_temp"],
            "humidity": random.randint(76, 92),
            "status": "IN TRANSIT",
            "route_progress": progress,
            "has_temperature_breach": r["is_breach"],
            "spoilage_risk": "HIGH" if r["is_breach"] else "LOW",
            "route_coordinates": coords_list,
            "departure_time": (base_date - timedelta(hours=3)).strftime('%I:%M %p'),
            "estimated_arrival": (base_date + timedelta(hours=2)).strftime('%I:%M %p'),
            "last_updated_at": base_date.isoformat(),
            "is_demo_data": True,
        }
        shipments.append(shipment)

    # 5. Generate 10-Step Deterministic Traceability Records
    print("5. Generating 10-Stage Cryptographic Traceability Audit Records...")
    traceability_records = []
    traceability_stages_template = [
        ("Seed & Soil Geofence Registration", "Plot verified, organic soil carbon tested", "Farmer Field Inspection"),
        ("Crop Registration & Health Monitoring", "Crop vigor index 0.88, zero prohibited agrochemicals", "FPO Agronomist"),
        ("Field Harvest & Preliminary Sorting", "Harvested in early morning cool hours", "Harvest Crew Lead"),
        ("AI Computer-Vision Quality Inspection", "Optical blemish scanning 94.2% Grade A conformance", "AgriFlow Vision Engine"),
        ("Lot Created & Virtual Cooperative Pooling", "Aggregated with local cluster farmers to meet 1T target", "Virtual Co-op Manager"),
        ("FPO Aggregation & Pre-Cooling", "Core temperature lowered to 8.0°C in solar cold room", "Shadnagar Cold Vault"),
        ("Reefer Truck Loading & IoT Sensor Seal", "E-Lock calibrated and cold chain activated", "Carrier Operator"),
        ("Real-Time Telematics & In-Transit Audit", "Continuous temperature and GPS tracking en-route", "IoT Telemetry Gateway"),
        ("Wholesale Gate Inspection & QC Gate Pass", "Direct terminal weight variance < 0.3% verified", "Buyer QC Lead"),
        ("Instant Bank Payout & Traceability Record", "Settlement cleared via NPCI Escrow to farmer account", "Smart Escrow Gateway"),
    ]

    for i in range(10):
        lot = crop_lots[i]
        stages = []
        prev_hash = "0x000000000000000000000000"
        
        for step_no, (stage_name, desc, verified_by) in enumerate(traceability_stages_template, start=1):
            seed_str = f"{lot['lot_id']}:{step_no}:{stage_name}:{prev_hash}"
            stage_hash = generate_demo_hash(seed_str)
            timestamp = (base_date - timedelta(days=(10 - step_no))).strftime('%Y-%m-%d %H:%M IST')

            stages.append({
                "stepNumber": step_no,
                "phase": stage_name,
                "status": "COMPLETED",
                "timestamp": timestamp,
                "location": lot["origin_place"],
                "actor": verified_by,
                "verifiedHash": stage_hash,
                "hashLabel": "Demo Verification Hash",
                "details": desc,
            })
            prev_hash = stage_hash

        record = {
            "id": f"trace-demo-{4000 + i}",
            "lot_id": lot["lot_id"],
            "crop": lot["crop"],
            "variety": lot["variety"],
            "farmer_name": lot["farmer_name"],
            "farm_location": f"{lot['origin_place']}, Telangana",
            "harvest_date": lot["harvest_date"],
            "assigned_grade": lot["quality_grade"],
            "initial_quantity_kg": lot["estimated_yield_kg"],
            "marketable_quantity_kg": lot["available_quantity_kg"],
            "current_status": "Delivered & Settled",
            "buyer_name": "Reliance Fresh Distribution Center",
            "final_payout_per_kg": round(lot["current_market_price_per_kg"] * 1.15, 2),
            "soil_health_score": random.randint(82, 94),
            "weather_shock_history": "Weather conditions nominal; yield verified",
            "current_temperature_reading": 5.8,
            "stages": stages,
            "is_demo_data": True,
        }
        traceability_records.append(record)

    # 6. Save Complete Demo Dataset to Local JSON Sync File
    output_dir = os.path.join(os.path.dirname(__file__), 'src', 'services', 'mockData')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'seededDemoData.json')

    payload = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_farmers": len(farmers),
            "total_fpo_clusters": len(fpo_clusters),
            "total_crop_lots": len(crop_lots),
            "total_shipments": len(shipments),
            "total_traceability_records": len(traceability_records),
            "is_demo_dataset": True,
        },
        "farmers": farmers,
        "fpo_clusters": fpo_clusters,
        "crop_lots": crop_lots,
        "shipments": shipments,
        "traceability_records": traceability_records,
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2)

    print(f"\n[OK] Saved synchronized demo dataset to: {output_file}")
    print(f"  - Farmers: {len(farmers)}")
    print(f"  - FPO Clusters: {len(fpo_clusters)}")
    print(f"  - Crop Lots: {len(crop_lots)}")
    print(f"  - Shipments: {len(shipments)} (Includes intentional breach: TRK-BREACH-DEMO-9099)")
    print(f"  - Traceability Records: {len(traceability_records)}")

    # 7. Attempt Supabase REST Injection
    if SUPABASE_URL and SUPABASE_KEY:
        print(f"\nAttempting Supabase sync to: {SUPABASE_URL}")
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }

        # Seed sample crop lots into public.produce
        produce_records = []
        for lot in crop_lots[:25]: # Seed first 25 lots to avoid payload size limit
            produce_records.append({
                "crop_name": lot["crop"],
                "variety": lot["variety"],
                "category": "Vegetables" if "Tomato" in lot["crop"] or "Onion" in lot["crop"] else "Spices",
                "quantity": lot["available_quantity_kg"],
                "unit": "kg",
                "quality_grade": lot["quality_grade"],
                "harvest_date": lot["harvest_date"],
                "asking_price": lot["asking_price"],
                "location": lot["origin_place"],
                "status": lot["status"],
            })

        try:
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/produce",
                data=json.dumps(produce_records).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            with urllib.request.urlopen(req) as resp:
                print(f"[OK] Successfully seeded {len(produce_records)} lots into Supabase public.produce (Status {resp.status})")
        except urllib.error.HTTPError as e:
            print(f"  Note: Supabase produce insert returned: {e.code} ({e.reason})")
        except Exception as ex:
            print(f"  Note: Supabase produce insert error: {ex}")
    else:
        print("\nNote: Supabase credentials not found in environment; running with local persistence sync.")

    print("\n" + "=" * 70)
    print("Phase 1 Seeder Complete!")
    print("=" * 70)

if __name__ == '__main__':
    run_seeder()
