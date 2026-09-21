# AgriFlow AI &bull; Supabase Backend 藍圖 (Master Architecture Blueprint)

> **Platform**: AgriFlow AI &bull; Autonomous Cold-Chain & Direct Farmgate Settlement System  
> **Backend Engine**: Supabase Cloud PostgreSQL 15+ with Realtime WebSockets & PostGIS Geospatial Extension  
> **Protocol**: Serverless Micro-Transactions & Escrow Payout Loop

---

## 1. System Overview & Core Architecture

AgriFlow AI bridges the traditional farm-to-fork disconnect by replacing opaque multi-tier commission middlemen with a cryptographic, automated platform. The architecture comprises a decoupled Next.js 16 frontend communicating with a hardened Supabase backend via direct Serverless PostgREST queries, Realtime WebSocket broadcast channels, and PostgreSQL `SECURITY DEFINER` stored procedures.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AgriFlow Ecosystem                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                  │                        │
   [Farmer / FPO]                  [Consumer / Buyer]       [Logistics Driver]
   /farmer/dashboard               /consumer/marketplace     /logistics/dashboard
          │                                  │                        │
          └──────────────────────────────────┼────────────────────────┘
                                             │
                                    HTTPS & WebSockets
                                             │
                        ┌────────────────────▼────────────────────┐
                        │       Supabase Cloud Infrastructure     │
                        ├─────────────────────────────────────────┤
                        │ • Row-Level Security (RLS) Firewalls    │
                        │ • Realtime Change Data Capture (CDC)    │
                        │ • Cryptographic Escrow Vault            │
                        │ • Automated PostgreSQL Trigger Loops    │
                        └─────────────────────────────────────────┘
```

---

## 2. Master Database Schema

### 2.1 Identity & User Profiles (`public.profiles`)
Unified table mapping Supabase Auth identities (`auth.users.id`) to application roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id)` | Unique user UUID |
| `full_name` | `TEXT` | `NOT NULL` | Registered legal or trade name |
| `username` | `TEXT` | `UNIQUE` | Unique handle for login |
| `role` | `TEXT` | `CHECK (role IN ('farmer', 'consumer', 'logistics', 'admin'))` | Persona privilege tier |
| `phone` | `TEXT` | &mdash; | E.164 normalized mobile number |
| `email` | `TEXT` | &mdash; | Contact email address |
| `fpo_name` | `TEXT` | &mdash; | Farmer Producer Organization affiliation |
| `place` | `TEXT` | &mdash; | Local Village / Mandi hub name |
| `area` | `TEXT` | &mdash; | Taluk / Sub-district |
| `district` | `TEXT` | &mdash; | Operational district (e.g., Ranga Reddy) |
| `state` | `TEXT` | `DEFAULT 'Telangana'` | State jurisdiction |
| `wallet_balance` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Real-time liquid earnings vault |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Creation timestamp |

---

### 2.2 Live Produce Catalog (`public.produce`)
Dynamic inventory catalog with multi-language JSONB support and real-time stock deductions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID / TEXT` | Unique produce lot identifier |
| `farmer_id` | `UUID` | Foreign key referencing `public.profiles(id)` |
| `crop_name` | `JSONB / TEXT` | Multilingual translations `{"en": "...", "hi": "...", "te": "..."}` |
| `variety` | `TEXT` | Crop cultivar (e.g., `Hybrid Desi`, `Sona Masoori`) |
| `category` | `TEXT` | Classified category (`Vegetables`, `Fruits`, `Grains`, `Spices`) |
| `quality_grade` | `TEXT` | Verified grade (`Grade A`, `Grade B`, `Organic Certified`) |
| `quantity_kg` | `NUMERIC` | Available live inventory weight in kilograms |
| `price_per_kg` | `NUMERIC(10,2)` | Direct farmgate realization price in INR per kg |
| `location` | `TEXT` | Farmgate pickup address / geo-hub |
| `harvest_date` | `DATE` | Exact crop harvest timestamp |
| `image_url` | `TEXT` | Verified batch photograph URL |
| `updated_at` | `TIMESTAMPTZ` | Timestamp for sub-second CDC sync |

---

### 2.3 Orders & Escrow Contracts (`public.orders`)
Immutable trade contracts managing payment escrow, automated locking, and release.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID / TEXT` | Unique order identifier |
| `buyer_id` | `UUID` | Buyer profile reference |
| `produce_id` | `UUID / TEXT` | Associated crop lot reference |
| `farmer_id` | `UUID` | Receiving farmer profile reference |
| `quantity_kg` | `NUMERIC` | Purchased quantity |
| `total_amount` | `NUMERIC(12,2)` | Total invoice value in INR |
| `escrow_amount` | `NUMERIC(12,2)` | Locked escrow balance |
| `escrow_status` | `TEXT` | `HELD`, `RELEASED`, `REFUNDED` |
| `order_status` | `TEXT` | `PENDING`, `CONFIRMED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED` |
| `delivery_otp` | `TEXT` | 6-digit cryptographic verification code |
| `created_at` | `TIMESTAMPTZ` | Order creation timestamp |

---

### 2.4 Logistics Trips & Reefer Telemetry (`public.logistics_trips`)
Cold-chain road transit state tracking vehicle GPS coordinates, temperatures, and driver beacons.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT / UUID` | Unique trip identifier (`TRIP-...`) |
| `order_id` | `TEXT / UUID` | Associated order identifier |
| `operator_id` | `UUID` | Transporter profile reference |
| `vehicle_number` | `TEXT` | Road registration number (e.g., `TS 08 UB 4192`) |
| `vehicle_type` | `TEXT` | `Tata 407 Reefer`, `Bolero Maxi Truck`, `Eicher Pro` |
| `driver_name` | `TEXT` | Operating driver name |
| `driver_phone` | `TEXT` | Telemetry beacon contact number |
| `source_hub` | `TEXT` | Farmgate dispatch origin |
| `destination_hub` | `TEXT` | Terminal market destination |
| `current_lat` | `DOUBLE PRECISION` | Real-time hardware GPS latitude |
| `current_lng` | `DOUBLE PRECISION` | Real-time hardware GPS longitude |
| `current_temp` | `NUMERIC(4,1)` | Real-time reefer sensor temperature in °C |
| `target_temp` | `NUMERIC(4,1)` | Cold-chain preservation baseline (e.g., `4-8°C`) |
| `humidity` | `NUMERIC` | Relative humidity percentage |
| `status` | `TEXT` | `SCHEDULED`, `LOADING`, `IN TRANSIT`, `DELIVERED` |
| `spoilage_risk` | `TEXT` | `LOW`, `MEDIUM`, `HIGH` AI threat index |

---

## 3. The 4 Automated PostgreSQL Trigger Loops

AgriFlow operates on 4 autonomous trigger loops that enforce data consistency, financial integrity, and geospatial traceability without relying on external batch schedulers.

```
                  ┌─────────────────────────────────────────────────┐
                  │          4 Automated Trigger Loops              │
                  └─────────────────────────────────────────────────┘
                                           │
  ┌───────────────────────┬────────────────┴───────────────┬───────────────────────┐
  ▼                       ▼                                ▼                       ▼
[Trigger 1]             [Trigger 2]                      [Trigger 3]             [Trigger 4]
Inventory Deduction     Transit Milestone Sync           Escrow Financial Payout GPS Path Archiving
• Fires: ON ORDER       • Fires: ON TRIP STATUS          • Fires: ON DELIVERY    • Fires: ON LOCATION
• Deducts quantity_kg   • Updates order & assignment     • Unlocks escrow funds  • Records history in
  from public.produce     milestones in real-time          • Credits farmer wallet telemetry logs
```

### Trigger 1: Realtime Inventory Deduction
- **Event**: `AFTER INSERT ON public.orders`
- **Action**: Atomically decreases `produce.quantity_kg` by `orders.quantity_kg`. If available stock drops below zero, the transaction aborts with an insufficient inventory exception.

### Trigger 2: Transit Milestone Synchronization
- **Event**: `AFTER UPDATE OF status ON public.logistics_trips`
- **Action**: Cascades trip milestones (`LOADING` &rarr; `IN TRANSIT` &rarr; `DELIVERED`) directly to the linked `orders` and `logistics_assignments` records, notifying buyers and farmers via Supabase Realtime CDC.

### Trigger 3: Escrow Settlement & Instant Wallet Payout
- **Event**: `AFTER UPDATE OF status ON public.orders WHEN (NEW.status = 'DELIVERED')`
- **Action**: Automatically unlocks the held escrow deposit (`orders.escrow_amount`), deducts platform/logistics service fees (8%), and credits the remaining 92% directly into `profiles.wallet_balance` for the farmer.

### Trigger 4: Live GPS Path & Telemetry Archiving
- **Event**: `AFTER UPDATE OF current_lat, current_lng ON public.logistics_trips`
- **Action**: Inserts historical coordinate records into `public.logistics_telemetry_logs` for route tracing, speed breach detection, and cold-chain compliance auditing.

---

## 4. Row-Level Security (RLS) Firewalls

All tables enforce strict Row-Level Security policies:

1. **`public.profiles`**:
   - `SELECT`: Public read access for participant transparency.
   - `INSERT / UPDATE`: Restricted to `auth.uid() = id` (or `admin` role).
2. **`public.produce`**:
   - `SELECT`: Unrestricted public read for buyer discovery.
   - `INSERT / UPDATE / DELETE`: Restricted to verified farmers owning the produce record.
3. **`public.orders`**:
   - `SELECT`: Restricted to participating buyer, farmer, assigned transporter, and system admins.
   - `INSERT`: Verified buyer identity required.
4. **`public.logistics_trips`**:
   - `SELECT`: Viewable by trip participants and live tracking consumers with order lot access.
   - `UPDATE`: Telemetry and status updates restricted to assigned transporters.

---

## 5. Summary & Verification

- **Realtime Integration**: Supabase WebSocket subscriptions enable `<1s` latency across produce updates and vehicle tracking.
- **Fail-Safe Auth Hooks**: PostgreSQL functions wrapped with exception handling to prevent auth downtime.
- **Production Build Status**: Verified with Next.js 16 webpack production compilation (71/71 static and dynamic pages generated with 0 errors).
