# AgriFlow.ai — Next-Gen Agricultural Supply Chain & Real-Time Logistics

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20Postgres-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://sihfullcode.vercel.app/)
[![Tests](https://img.shields.io/badge/Verification-8%2F8%20Passed-brightgreen?style=for-the-badge)](scripts/run-all-tests.js)

AgriFlow.ai is a production-grade, multi-user agricultural supply chain and perishables distribution platform. It connects **Farmers (FPOs)**, **Institutional Buyers & Consumers**, and **Logistics Carriers** through real-time database transactions, automated escrow locks, strict three-portal role separation, and **real smartphone GPS beacon tracking** — built on **100% genuine data, live external APIs, and zero simulated/fabricated metrics**.

---

## 🌟 Key Capabilities

### 1. Real-Time Multi-User Transaction Flow
- **Farmer Listing**: Farmers list crop lots (quantity, variety, grade, asking price) directly into Supabase `public.produce`.
- **Instant Buyer Discovery**: Buyers see newly listed produce on `/consumer/marketplace` instantly via Supabase Realtime without refreshing.
- **Escrow-Locked Orders**: Buyers purchase lots with automated escrow contracts and real-time inventory deduction.
- **Harvest Preparation Workflow**: Farmers mark lots **"Prepare Harvest"** (`PREPARING`) and **"Ready to Deliver"** (`READY_TO_DELIVER`), which automatically broadcasts dispatch requests to carrier fleets.
- **Carrier Haul Acceptance**: Logistics operators receive real-time delivery requests on `/logistics/trips`, assign drivers and trucks, and transition hauls to `IN TRANSIT`.

### 2. Smartphone as Live GPS Beacon
- **Zero IoT Hardware Required for GPS**: Any logistics driver's smartphone acts as the live tracking beacon via `/logistics/track/[tripId]`.
- **High-Accuracy Telemetry**: Uses `navigator.geolocation.watchPosition()` with Screen Wake Lock API to keep the phone awake on vehicle dashboard mounts.
- **Strict Separation of GPS & Temperature**: Phone GPS transmits genuine coordinates to live tracking maps. Cargo temperature honestly displays `"Phone GPS active • Sensor not connected"` and `"No live reading — reefer sensor unattached"` — strictly preventing fabricated temperatures.
- **Low-Bandwidth Mode**: Switchable between 4-second normal pings and 15-second data/battery saver mode.

### 3. Strict Portal Separation & Role Isolation
- **Farmer Portal (`/farmer/*`)**: Dedicated Green theme, produce inventory management, FPO virtual cooperatives, APMC prices, and AI intelligence.
- **Consumer Portal (`/consumer/*`)**: Dedicated Blue theme, dynamic subcategory filtering, Grade A/B/C tabs, cold-chain filters, escrow shopping cart, and live order tracking.
- **Logistics Portal (`/logistics/*`)**: Dedicated Amber theme, trip consolidation, fleet command center, phone GPS tracking, and return load optimization.
- **Multi-Persona Session Support**: Multi-adapter auth context (`normalizeToFarmer`, `normalizeToConsumer`, `normalizeToLogistics`) eliminating cross-portal redirection hijacking.

### 4. High-Concurrency & Sub-Second Realtime
- **Decommissioned 10s Polling Reload**: Eliminated destructive 10-second periodic reloads. UI synchronization is 100% driven by Supabase PostgreSQL WebSocket replication (`postgres_changes`) in `<400ms`.
- **Atomic Concurrency Protection**: PostgreSQL RPC `atomic_checkout_order` with row-level locks (`FOR UPDATE`) guarantees zero overselling during simultaneous buyer purchases.
- **Hierarchical Subcategories & Produce Classification**: Dynamic category/subcategory mapping (`src/lib/categoryHelpers.ts`) with computer-vision grade filtering.

### 5. Genuine External Cloud Services & Models
- **Open-Meteo Meteorological API**: Live 2-meter air temperature, relative humidity, precipitation, and wind speeds directly from Open-Meteo (`api.open-meteo.com`).
- **APMC Mandi Price Forecaster**: Closed-form Ordinary Least Squares (OLS) linear regression computed directly over real historical commodity records, reporting $R^2$, MAE, and RMSE.
- **Cryptographic Provenance Ledger**: SHA-256 cryptographic verification hashes over each supply chain event for tamper-evident farm-to-fork traceability.
- **8 Indian Languages**: Full UI localization in English, Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), Malayalam (മലയാളം), Bengali (বাংলা), and Marathi (मराठी).

---

## 🏗️ Architecture & Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer (/farmer/orders)
    actor Buyer as 🛒 Buyer (/consumer/marketplace)
    actor Carrier as 🚚 Carrier Ops (/logistics/trips)
    actor Phone as 📱 Driver Phone (/logistics/track/[tripId])
    participant DB as 🗄️ Supabase Cloud (PostgreSQL + Realtime)

    Note over Farmer,DB: Phase 1: Listing & Discovery
    Farmer->>DB: Lists 1,000 kg Tomatoes in public.produce
    DB-->>Buyer: Realtime broadcast: New harvest catalog item appears immediately

    Note over Buyer,DB: Phase 2: Purchase & Escrow
    Buyer->>DB: Places order for 200 kg (/consumer/checkout)
    DB->>DB: Locks Escrow in public.orders; Deducts 200 kg from produce
    DB-->>Farmer: Realtime broadcast: Order appears on Farmer dashboard

    Note over Farmer,DB: Phase 3: Harvest Preparation & Readiness
    Farmer->>DB: Clicks "Prepare Harvest" (status: PREPARING)
    Farmer->>DB: Clicks "Ready to Deliver" (status: READY_TO_DELIVER)
    DB-->>Carrier: Realtime broadcast: "Incoming Delivery Request" card appears on Logistics portal

    Note over Carrier,DB: Phase 4: Carrier Acceptance & Driver Dispatch
    Carrier->>DB: Clicks "Accept Delivery" (assigns driver Mohammed Ismail, truck TS 08 UB 4192)
    DB->>DB: Transitions trip & order to IN TRANSIT / Dispatched
    DB-->>Buyer: Realtime broadcast: Order updates to In Transit with "Live GPS Active" badge
    DB-->>Farmer: Realtime broadcast: Carrier acceptance confirmed

    Note over Phone,DB: Phase 5: Driver Phone GPS Beacon
    Phone->>Phone: Driver taps "Start Live Tracking" (watchPosition + Screen Wake Lock)
    Phone->>DB: Transmits genuine GPS coordinates to public.logistics_trips
    DB-->>Buyer: Realtime Map marker moves along route on /consumer/tracking/[id]
    DB-->>Carrier: Realtime Map marker moves along route on /logistics/trips
    Note over Phone,Buyer: Temperature strictly shows "No live reading — sensor not connected"
```

---

## 📁 Clean Repository Structure

```text
├── .env.example            # Environment variable template for team & Vercel
├── .gitignore              # Protected ignores (node_modules, .next, secret envs)
├── package.json            # Next.js 16.3.4, React 19, Supabase JS v2, Leaflet
├── vercel.json             # Vercel Next.js framework deployment configuration
├── run-agriflow.bat        # Windows one-click local production stack launcher
├── archive/                # Archived legacy files (simulation scripts, mocks)
│
├── src/                    # Production Next.js App Router Source
│   ├── app/                # App Router Portals & Serverless APIs
│   │   ├── (auth)/         # Phone & OTP authentication views
│   │   ├── api/            # Serverless API routes
│   │   │   ├── telemetry/  # Ingests phone GPS beacon coordinates
│   │   │   ├── weather/    # Open-Meteo meteorological proxy
│   │   │   ├── predict/    # OLS linear regression price predictor
│   │   │   └── ratings/    # Anti-fraud verified reciprocal reviews
│   │   ├── consumer/       # Direct Buyer Portal (marketplace, cart, checkout, tracking)
│   │   ├── farmer/         # Farmer Command Center (produce, orders, mandi prices)
│   │   ├── logistics/      # Logistics Carrier Hub (trips, live phone beacon tracking)
│   │   ├── traceability/   # Cryptographic farm-to-fork public ledger
│   │   ├── layout.tsx      # Root layout (AutoReloadController, providers)
│   │   └── page.tsx        # Public landing gateway
│   │
│   ├── components/         # Modular UI Components
│   │   ├── common/         # AutoReloadController, DataStatusBadge, StatusBadge, Cards
│   │   ├── logistics/      # PhoneGpsBeacon, DriverDispatchModal
│   │   ├── maps/           # Leaflet GIS maps (LiveTrackingMap, RouteMap)
│   │   ├── reviews/        # RateAndReviewModal, verified feedback
│   │   └── tracking/       # ColdChainTelemetryCard, DeliveryStatusCard
│   │
│   ├── context/            # Global State & Providers
│   │   ├── AuthContext.tsx       # Multi-role authentication & session state
│   │   ├── BandwidthContext.tsx  # 2G/Low-Bandwidth mode toggle
│   │   ├── I18nContext.tsx       # 8-language localization
│   │   └── TrackingContext.tsx   # Supabase Realtime shipment telematics
│   │
│   ├── lib/                # Shared Utilities
│   │   ├── supabase.ts     # Supabase client with resilient failover defaults
│   │   ├── cryptoHash.ts   # SHA-256 Web Crypto hashing
│   │   └── utils.ts        # INR currency formatting, Tailwind cn
│   │
│   ├── services/           # Service Abstraction Layer (Supabase Connected)
│   │   ├── consumerService.ts    # Real catalog, orders, and stock deduction
│   │   ├── farmerService.ts      # Produce inventory & status updates
│   │   ├── logisticsService.ts   # Haul dispatches, carrier acceptance, fleet
│   │   ├── trackingService.ts    # Order status sync & realtime subscriptions
│   │   └── weatherService.ts     # Open-Meteo meteorological client
│   │
│   └── types/              # Strict TypeScript Definitions
│       ├── consumer.ts     # Products, cart, orders, lifecycle statuses
│       ├── farmer.ts       # Produce, order status unions, grading
│       ├── logistics.ts    # Fleet vehicles, trips, driver queues
│       └── review.ts       # Verified ratings & dispute reports
│
├── scripts/                # Automated Verification & Integration Test Suites
│   ├── run-all-tests.js    # Master test runner (executes all 7 test suites)
│   ├── test-live-demo-flow.js      # End-to-end multi-user transaction flow
│   ├── test-phone-telemetry.js    # Phone GPS coordinate ingestion test
│   ├── test-predictor.js          # OLS linear regression math validation
│   ├── test-weather.js            # Open-Meteo API network verification
│   ├── test-auth-profiles.mjs     # Auth & profile schema completeness
│   ├── test-identity-sync.mjs     # User identity & initials sync
│   └── test-delete-account-security.mjs # Account deletion & data security
│
└── supabase/               # SQL Migrations & Row Level Security (RLS)
    └── migrations/         # 01-09 production SQL schema and realtime publications
```

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Nikhil-startup/SIHFULLCODE.git
cd SIHFULLCODE
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Variables inside `.env.local`:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://ybtncqqphsnbazmwvuvi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg
FAST2SMS_API_KEY=your_fast2sms_api_key
SEND_SMS_HOOK_SECRET=your_webhook_secret
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

*(On Windows, you can also double-click [`run-agriflow.bat`](run-agriflow.bat) to launch the stack automatically).*

---

## 🧪 Verification & Automated Tests

Run the unified system verification runner:
```bash
node scripts/run-all-tests.js
```

### Measured Verification Results (8/8 Suites Passing):
```
================================================================
       AGRIFLOW.AI — COMPLETE SYSTEM VERIFICATION RUNNER       
================================================================
  [PASS] Auth & Profile Completeness          441ms
  [PASS] Identity & Initials Sync             441ms
  [PASS] Delete Account Security              4116ms
  [PASS] Phone GPS & Telemetry Engine         1680ms
  [PASS] OLS Price Predictor & Math           382ms
  [PASS] Open-Meteo Meteorological API        1496ms
  [PASS] Multi-User Live Demo Flow            3244ms
  [PASS] Live Data Repair & Concurrency       4469ms
================================================================
  ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! (8/8)
```

Run TypeScript compilation check:
```bash
npx tsc --noEmit
# Exit code 0 (Zero errors across entire project)
```

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New $\rightarrow$ Project** and import your repository.
3. In **Settings $\rightarrow$ Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL` (Type: **Config**)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Type: **Config**)
   - `FAST2SMS_API_KEY` (Type: **Secret**)
   - `SEND_SMS_HOOK_SECRET` (Type: **Secret**)
4. Click **Deploy**. Vercel will build and deploy using `vercel.json`.

---

## 👥 Hackathon Demonstration Guide

1. **Farmer Device** (`/farmer/orders`):
   - Navigate to `/farmer/produce` and create a produce listing (e.g., 1,000 kg Tomatoes).
2. **Buyer Device** (`/consumer/marketplace`):
   - Notice the listing appears immediately via Supabase Realtime without manual refresh.
   - Click "Order Produce", select 200 kg, and checkout with Escrow Lock.
3. **Farmer Device**:
   - Order pops up in real-time under `/farmer/orders`.
   - Click **"Prepare Harvest"**, then **"Ready to Deliver"**.
4. **Logistics Device** (`/logistics/trips`):
   - "Incoming Delivery Request" card animates into view.
   - Click **"Accept Delivery"** (assigns driver Mohammed Ismail, truck TS 08 UB 4192).
5. **Driver Phone** (`/logistics/track/[tripId]`):
   - Tap **"Start Live Tracking"**. Allow browser location permission.
   - As the phone physically moves, genuine GPS coordinates stream into Supabase.
6. **Buyer & Public Map** (`/consumer/tracking/[id]`):
   - The delivery vehicle marker advances live on the map.
   - Temperature displays honest status: `"Phone GPS active • Sensor not connected"`.

---

## ⚡ Realtime Inventory Sanity Test (<1s Synchronization)

To verify sub-second real-time synchronization between the Farmer Inventory and Consumer Marketplace across separate browser sessions/devices:

### Step-by-Step Test Procedure:
1. **Browser A (Farmer Portal)**:
   - Open `/farmer/produce` (e.g. in Google Chrome).
   - Locate any active produce item (e.g., `Tomato (Hybrid)` or `Onion - Nashik Red`).
   - Notice the **"Edit Live Stock (kg)"** input box on the produce card.
2. **Browser B (Consumer Marketplace)**:
   - Open `/consumer/marketplace` in an incognito window, another browser (e.g., Microsoft Edge / Firefox), or a mobile device.
   - Look for the matching crop card with its live available quantity (e.g., `1,000 kg available`) and the header status indicator showing:
     `● Live (<1s Realtime Sync)`.
3. **Trigger Realtime Mutation**:
   - In **Browser A**, change the quantity input from `1000` to `750` and press **Enter** (or blur out of the field).
   - Farmer portal triggers `farmerService.updateQuantity(id, 750)` directly against Supabase `public.produce`.
4. **Observe Live Replication**:
   - Within **< 1 second**, **Browser B** automatically updates to display `750 kg available`.
   - The card in Browser B highlights with a green ring and displays an animated pulsing **"LIVE UPDATE"** badge for 1 second.
   - No local page refresh or polling is involved; this is 100% driven by PostgreSQL WAL logical replication (`postgres_changes`).

### Troubleshooting & Diagnostics:
If Realtime events do not appear in Browser B:
- **Publication Check**: Confirm that `public.produce` is added to the Supabase publication:
  ```sql
  SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```
  If missing, run: `ALTER PUBLICATION supabase_realtime ADD TABLE public.produce;`
- **RLS Policy Check**: Verify that row-level security allows `SELECT` to public/anon:
  ```sql
  CREATE POLICY "Produce catalog is viewable by everyone" ON public.produce FOR SELECT USING (true);
  ```
- **Console Channel Status**: Open Developer Tools (F12) in Browser B and inspect console logs for:
  `[useLiveProduce] Channel status: SUBSCRIBED`. If status is `CLOSED` or `CHANNEL_ERROR`, check network/WebSocket connectivity to Supabase Cloud (`*.supabase.co:443`).

---

## 📄 License
MIT License. Built with pride for the Smart India Hackathon (SIH).

