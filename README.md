# AgriFlow AI — Frontend Web Platform

AgriFlow AI is a modern, multilingual, and bandwidth-optimized Next.js frontend platform connecting Farmers, Consumers/Institutional Buyers, and Logistics Operators with transparent pricing, route tracking, crop intelligence, and direct farm-to-fork sourcing.

Built using **Antigravity UI**, **Next.js 16 (React 19)**, and **Tailwind CSS**.

---

## 📁 Clean Repository Structure

```text
├── public/                 # Static assets, SVG icons, and public media
├── src/                    # Next.js App Router & Frontend Source
│   ├── app/                # App Router Portals & Routing
│   │   ├── (auth)/         # Authentication & gateway views
│   │   ├── api/            # API Route handlers (ratings, reports)
│   │   ├── consumer/       # Consumer & Bulk Buyer Portal (marketplace, cart, checkout, tracking)
│   │   ├── farmer/         # Farmer Command Center (produce, mandi prices, recommendations, demand map)
│   │   ├── logistics/      # Cold-Chain Logistics Hub (trips, telematics, return loads)
│   │   ├── globals.css     # Global styles & theme tokens
│   │   ├── layout.tsx      # Root layout & context providers
│   │   └── page.tsx        # Main public gateway portal
│   │
│   ├── components/         # Reusable UI Component Library
│   │   ├── auth/           # Phone & OTP authentication forms
│   │   ├── common/         # Buttons, Cards, Modals, LanguageSelector, LowBandwidthToggle
│   │   ├── consumer/       # Produce cards, price breakdown waterfalls, farmer story modals
│   │   ├── farmer/         # Group selling pools, best time to sell cards, impact metrics
│   │   ├── intelligence/   # Crop quality scanner, decision summary, what-if simulators, loss alerts
│   │   ├── maps/           # Leaflet GIS maps (LiveTrackingMap, RouteMap)
│   │   ├── reports/        # Dispute reporting modals
│   │   ├── reviews/        # Verified transaction ratings & review modals
│   │   └── tracking/       # Cold-chain telematics cards, driver details, proof of delivery
│   │
│   ├── config/             # Business & algorithmic configuration
│   │   ├── cropThresholds.ts # Temperature, humidity, and Brix standards for perishables
│   │   └── pricingConfig.ts  # Price waterfall formulas and margin tiers
│   │
│   ├── context/            # React Context Providers
│   │   ├── AuthContext.tsx       # Multi-role authentication & session state
│   │   ├── BandwidthContext.tsx  # 2G/Low-Bandwidth mode toggle & state
│   │   ├── CartContext.tsx       # Shopping cart & weight accumulation
│   │   ├── I18nContext.tsx       # 7-language localization & persistent user preferences
│   │   ├── ThemeContext.tsx      # Dark / Light theme toggle
│   │   └── TrackingContext.tsx   # Live shipment telematics state
│   │
│   ├── i18n/               # Multilingual Translation Dictionaries
│   │   ├── en.ts           # English
│   │   ├── hi.ts           # Hindi (हिन्दी)
│   │   ├── te.ts           # Telugu (తెలుగు)
│   │   ├── ta.ts           # Tamil (தமிழ்)
│   │   ├── ml.ts           # Malayalam (മലയാളം)
│   │   ├── bn.ts           # Bengali (বাংলা)
│   │   └── mr.ts           # Marathi (मराठी)
│   │
│   ├── lib/                # Utility Libraries & Client Helpers
│   │   ├── apiClient.ts    # Typed fetch client with timeouts & error handling
│   │   ├── ratingsStore.ts # Client store for verified reviews
│   │   ├── utils.ts        # Formatting helpers (INR currency, dates, classNames)
│   │   └── validators.ts   # Zod runtime schemas for form validation
│   │
│   ├── services/           # Service Abstraction Layer (Ready for Supabase)
│   │   ├── aiService.ts                  # Multi-factor recommendation model
│   │   ├── buyerMatchingService.ts       # Institutional buyer ranking
│   │   ├── coldChainRiskService.ts       # Spoilage risk evaluation
│   │   ├── consumerService.ts            # Marketplace catalog & orders
│   │   ├── destinationOptimizerService.ts# Optimal delivery hub selection
│   │   ├── farmerService.ts              # Produce inventory & listings
│   │   ├── foodLossService.ts            # Food wastage alerts
│   │   ├── intelligenceCoordinator.ts    # AI Decision Center coordination
│   │   ├── logisticsService.ts           # Fleet & road trips management
│   │   ├── marketPriceService.ts         # Mandi price feeds & forecasts
│   │   ├── pricingEngine.ts              # Price waterfall calculation
│   │   ├── ratingService.ts              # Anti-fraud verified ratings
│   │   ├── trackingService.ts            # Road shipment tracking
│   │   ├── weatherShockService.ts        # Climate risk simulation
│   │   └── mockData/                     # Comprehensive seed datasets
│   │
│   └── types/              # TypeScript Interface Definitions
│       ├── consumer.ts     # Products, cart, orders
│       ├── delivery.ts     # Shipments, telematics, waypoints
│       ├── farmer.ts       # Crops, pools, demand zones, recommendations
│       ├── intelligence.ts # Decision models, loss forecasts
│       ├── logistics.ts    # Fleet vehicles, trips, return loads
│       └── review.ts       # Verified ratings, reviews, reports
│
├── next.config.ts          # Next.js build configuration
├── tailwind.config.js      # Tailwind CSS theme & typography tokens
├── tsconfig.json           # TypeScript strict compiler configuration
└── package.json            # Project dependencies and run scripts
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Next.js Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🏗️ Production Build

```bash
npm run build
```

---

## 🌐 Supported Features

* **3 Dedicated Portals:** Farmer Command Center, Consumer Sourcing Marketplace, Road Logistics Hub.
* **7 Indian Languages:** Full UI localization across all pages.
* **Low-Bandwidth Mode:** Instant toggle that replaces heavy GIS maps and charts with lightweight, zero-latency tables.
* **Explainable AI Recommendations:** Multi-factor scoring analyzing demand deficits, road distance, perishable freshness windows, and net farmer realization.
* **Transparent Price Waterfall:** Real-time audited cost breakdown (Farmer payout + Road freight + Platform fee).
* **Target Backend:** Supabase (PostgreSQL with Row Level Security, Storage, and Edge Functions).
