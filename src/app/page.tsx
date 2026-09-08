'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  Store, 
  Truck, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  RotateCcw, 
  ChevronRight,
  ArrowUpRight,
  Layers,
  ThermometerSnowflake
} from 'lucide-react';
import { mockConsumerProducts } from '@/services/mockData/mockConsumerData';

export default function CombinedMainHub() {
  const [activeTab, setActiveTab] = useState<'farmer' | 'buyer' | 'logistics' | 'workflow'>('farmer');

  const [sampleCrop, setSampleCrop] = useState<'tomato' | 'chilli' | 'onion'>('tomato');
  const cropStats = {
    tomato: { name: 'Tomato (Hybrid Desi)', grade: 'A', score: 94, defect: '1.2%', realization: '₹42 /kg (+28%)', desc: 'High visual symmetry, 92% uniform red hue index, <2% blemishes.' },
    chilli: { name: 'Guntur Green Chilli (G4)', grade: 'A', score: 96, defect: '0.8%', realization: '₹58 /kg (+31%)', desc: 'Dark green, 9cm average length, firm skin with high capsaicin snap.' },
    onion: { name: 'Nashik Red Onion', grade: 'B', score: 86, defect: '4.5%', realization: '₹28 /kg (+24%)', desc: 'Triple layer dry skin, 50mm bulb diameter, moisture tested at 13.2%.' },
  };

  const [logisticsTemp, setLogisticsTemp] = useState<number>(5.8);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> AgriFlow AI Unified Ecosystem
          </span>
          <span className="hidden md:inline text-slate-400">• Farmer Portal + Buyer Marketplace + Reefer Logistics</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/farmer/dashboard" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
            <Sprout className="w-3 h-3" /> Farmer Portal
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/consumer/marketplace" className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1">
            <Store className="w-3 h-3" /> Buyer Marketplace
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/logistics" className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
            <Truck className="w-3 h-3" /> Cold Chain Fleet
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Agri<span className="text-emerald-400">Flow</span> AI
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Unified Gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Direct farm procurement, group selling & cold chain tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/farmer/dashboard"
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Farmer Portal</span>
            </Link>
            <Link
              href="/consumer/marketplace"
              className="px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-800 hover:bg-teal-900/80 text-teal-300 text-xs font-semibold transition flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buyer Store</span>
            </Link>
            <Link
              href="/logistics"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-cyan-950"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Live Fleet</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Direct Farm Sourcing • Group Selling • Smart Cold Chain
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            One Unified Platform for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Farmers, Buyers & Fleets
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminating middleman leakages with direct collective marketplace sourcing, group selling, and IoT reefer telemetry with return-haul optimization.
          </p>
        </div>

        {/* Live System Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">+28.4%</div>
              <div className="text-xs text-slate-400">Avg Farmer Realization Uplift</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">42+ FPOs</div>
              <div className="text-xs text-slate-400">Verified Collectives & Clusters</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">99.4%</div>
              <div className="text-xs text-slate-400">Cold Chain Safe Temperature</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">142 km</div>
              <div className="text-xs text-slate-400">Empty Backhaul Avoided / Trip</div>
            </div>
          </div>
        </div>

        {/* 3 Pillar Portals Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Farmer & FPO */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-900/60 p-6 flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-950/50 transition duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/80 flex items-center justify-center text-emerald-400">
                  <Sprout className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Farmer & FPO Portal
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  🌾 Farmer & Collective Portal
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  List harvest lots, declare quantities, explore regional mandi forecasts, and consolidate loads with nearby farmers.
                </p>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct Farm-Gate Produce Listing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Multi-Mandi APMC Price Forecasting</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>FPO Produce Pooling & Group Transport</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct Escrow Payment Release</span>
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-2">
              <Link
                href="/farmer/dashboard"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950"
              >
                <span>Open Farmer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/farmer/produce"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Produce Inventory
                </Link>
                <Link
                  href="/farmer/demand-map"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Demand Heatmap
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 2: Buyer & Consumer */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-900/60 p-6 flex flex-col justify-between hover:border-teal-500/60 hover:shadow-2xl hover:shadow-teal-950/50 transition duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-950 border border-teal-700/80 flex items-center justify-center text-teal-400">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  Buyer & Consumer Portal
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition">
                  🛒 Direct Buyer Marketplace
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Procure certified Grade A/B/Organic produce directly from farm gates. Transparent farmer payout breakdown with multi-farmer basket pooling.
                </p>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400">✓</span>
                  <span>Certified Grade A/B/Organic Filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400">✓</span>
                  <span>Multi-Farmer Order Consolidation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400">✓</span>
                  <span>Transparent Price & Impact Receipt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400">✓</span>
                  <span>Know-Your-Farmer Sourcing Traceability</span>
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-2">
              <Link
                href="/consumer/marketplace"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-teal-950"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/consumer/dashboard"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Buyer Orders
                </Link>
                <Link
                  href="/consumer/cart"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Procurement Cart
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 3: Logistics & Telemetry */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-900/60 p-6 flex flex-col justify-between hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-950/50 transition duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-cyan-400">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Fleet & Cold Chain
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                  🚚 Smart Reefer & GPS Fleet
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time GPS highway telemetry with live IoT temperature & humidity sensors, automated spoilage alerts, and return load matching.
                </p>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Live GPS Highway Route Tracker</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>IoT Reefer Temperature Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Spoilage Window Risk Prevention</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Backhaul Return Load Matching</span>
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-2">
              <Link
                href="/logistics"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-950"
              >
                <span>Open Fleet Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/farmer/tracking/TRK-RD-9021"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Live GPS Route
                </Link>
                <Link
                  href="/consumer/tracking/TRK-CONS-ROAD-9021"
                  className="py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium text-center border border-slate-700 transition"
                >
                  Buyer Tracking
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Feature Simulator Hub */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox & Feature Previews
              </div>
              <h2 className="text-2xl font-black text-white">Experience AgriFlow in Action</h2>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setActiveTab('farmer')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'farmer' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Farmer Sourcing</span>
              </button>
              <button
                onClick={() => setActiveTab('buyer')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'buyer' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Marketplace (Buyer)</span>
              </button>
              <button
                onClick={() => setActiveTab('logistics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'logistics' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Cold Chain (Fleet)</span>
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'workflow' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Pipeline</span>
              </button>
            </div>
          </div>

          {/* TAB 1: FARMER HARVEST LISTING PREVIEW */}
          {activeTab === 'farmer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Direct Harvest Listing & Sourcing
                </span>
                <h3 className="text-xl font-black text-white">
                  Farm Harvest Declarations & Realization
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a crop to explore listed harvest lots, view regional market prices, and calculate guaranteed net bank realizations.
                </p>

                <div className="flex gap-2 pt-2">
                  {(['tomato', 'chilli', 'onion'] as const).map((crop) => (
                    <button
                      key={crop}
                      onClick={() => setSampleCrop(crop)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition border ${
                        sampleCrop === crop
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/farmer/produce"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
                  >
                    <span>Explore Produce Inventory</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white">{cropStats[sampleCrop].name}</div>
                    <div className="text-xs text-slate-400">{cropStats[sampleCrop].desc}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Grade Classification</span>
                    <span className="text-lg font-black text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      Grade {cropStats[sampleCrop].grade}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Batch Volume</span>
                    <strong className="text-emerald-400 text-lg">2,400 kg</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Listing Status</span>
                    <strong className="text-cyan-400 text-sm font-bold block mt-1">Active Listing</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Direct Realization</span>
                    <strong className="text-teal-400 text-sm font-bold block mt-1">{cropStats[sampleCrop].realization}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUYER MARKETPLACE PREVIEW */}
          {activeTab === 'buyer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Direct Farm-Gate Marketplace Items</h3>
                  <p className="text-xs text-slate-400">Direct procurement from verified FPOs without middleman commission.</p>
                </div>
                <Link
                  href="/consumer/marketplace"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
                >
                  <span>View All 12+ Crops</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockConsumerProducts.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-teal-500/40 transition">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                          {p.grade}
                        </span>
                        <span className="text-xs font-black text-white">₹{p.priceBreakdown.consumerPricePerKg}/kg</span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{p.farmerStory.farmOrFpoName}</span>
                      <Link
                        href={`/consumer/product/${p.id}`}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOGISTICS REEFER SIMULATOR */}
          {activeTab === 'logistics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Smart Reefer & Sensor Telemetry
                </span>
                <h3 className="text-xl font-black text-white">
                  Interactive Cold-Chain Health Test
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag the temperature slider below to simulate real-time IoT sensors inside the vehicle. Notice how the spoilage risk dynamically recalibrates.
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Simulate Sensor Reading:</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">{logisticsTemp.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="16"
                    step="0.5"
                    value={logisticsTemp}
                    onChange={(e) => setLogisticsTemp(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>2.0°C (Deep Cool)</span>
                    <span>6.0°C (Optimal)</span>
                    <span>16.0°C (Warning)</span>
                  </div>
                </div>

                <div>
                  <Link
                    href="/logistics"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950"
                  >
                    <span>Open Fleet & Map Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">Tata 407 Reefer (TS 08 UB 4192)</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Trip: Shadnagar → Hyderabad
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Temperature</span>
                    <strong className="text-cyan-400 text-base">{logisticsTemp.toFixed(1)}°C</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Spoilage Risk</span>
                    <strong className={`text-base ${logisticsTemp > 10 ? 'text-red-400' : logisticsTemp > 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {logisticsTemp > 10 ? 'HIGH' : logisticsTemp > 7 ? 'MEDIUM' : 'LOW'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 block">Safe Window</span>
                    <strong className="text-white text-base">
                      {logisticsTemp > 10 ? '1 hr 15m' : logisticsTemp > 7 ? '2 hrs 40m' : '4 hrs 30m'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-300 block">Matched Return Haul</span>
                    <span className="text-slate-400 text-[11px]">Organic Bio-Fertilizer (Hyderabad → Warangal)</span>
                  </div>
                  <span className="font-black text-emerald-400">+₹2,800</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPLETE END-TO-END WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-lg font-bold text-white">End-to-End AgriFlow Life Cycle</h3>
                <p className="text-xs text-slate-400">How produce moves from farm harvest to verified buyer delivery with zero middleman loss.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 font-black text-sm flex items-center justify-center mx-auto">1</div>
                  <h4 className="text-xs font-bold text-white">Harvest & Listing</h4>
                  <p className="text-[11px] text-slate-400">Farmer declares crop quantity, location hub, and target price realization.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 font-black text-sm flex items-center justify-center mx-auto">2</div>
                  <h4 className="text-xs font-bold text-white">Demand & Mandi</h4>
                  <p className="text-[11px] text-slate-400">Mandi forecast engine & demand heatmap identify highest margin buyers.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 font-black text-sm flex items-center justify-center mx-auto">3</div>
                  <h4 className="text-xs font-bold text-white">Direct Sourcing</h4>
                  <p className="text-[11px] text-slate-400">Buyers order direct from FPO clusters with multi-farmer basket pooling.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 font-black text-sm flex items-center justify-center mx-auto">4</div>
                  <h4 className="text-xs font-bold text-white">Cold Chain Transit</h4>
                  <p className="text-[11px] text-slate-400">IoT sensors broadcast temperature, humidity & live GPS route coordinates.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 font-black text-sm flex items-center justify-center mx-auto">5</div>
                  <h4 className="text-xs font-bold text-white">POD & Direct Payout</h4>
                  <p className="text-[11px] text-slate-400">Digital OTP delivery verification triggers instant payout to farmer bank accounts.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Master Directory Map of All Routes */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation Index</span>
            <h2 className="text-2xl font-black text-white mt-1">Complete AgriFlow Portal Directory</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Farmer Routes */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-emerald-400 font-bold text-sm">
                <Sprout className="w-4 h-4" />
                <span>Farmer / FPO Routes</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/farmer/dashboard" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>🌾 Farmer Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/produce" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>🌾 Produce Inventory & Listing</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/demand-map" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>🗺️ Regional Demand Heatmap</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/market-prices" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>📈 APMC Mandi Price Trends</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/recommendations" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>✨ AI Best-Time-To-Sell Advice</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/orders" className="text-slate-300 hover:text-emerald-400 transition flex items-center justify-between">
                    <span>📦 Orders & Payout Status</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Buyer Routes */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-teal-400 font-bold text-sm">
                <Store className="w-4 h-4" />
                <span>Buyer / Marketplace Routes</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/consumer/marketplace" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>🛒 Produce Marketplace</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/dashboard" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>📊 Buyer Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/cart" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>🛍️ Procurement Cart</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/checkout" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>💳 Consolidated Checkout</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/orders" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>📜 Orders & Impact Receipts</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/product/prod-tom-01" className="text-slate-300 hover:text-teal-400 transition flex items-center justify-between">
                    <span>🍅 Farm-Story Product Detail</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Logistics Routes */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-cyan-400 font-bold text-sm">
                <Truck className="w-4 h-4" />
                <span>Logistics & Cold-Chain Routes</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/logistics" className="text-slate-300 hover:text-cyan-400 transition flex items-center justify-between">
                    <span>🚚 Reefer Fleet Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/tracking/TRK-RD-9021" className="text-slate-300 hover:text-cyan-400 transition flex items-center justify-between">
                    <span>🗺️ Live Highway GPS Route</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/consumer/tracking/TRK-CONS-ROAD-9021" className="text-slate-300 hover:text-cyan-400 transition flex items-center justify-between">
                    <span>📡 Buyer Live Telemetry Tracker</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/farmer/demand-map" className="text-slate-300 hover:text-cyan-400 transition flex items-center justify-between">
                    <span>📍 Corridor Demand Map</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-400">AgriFlow AI • SIH Smart India Hackathon End-to-End Agri Platform</p>
        <p>Direct Farmer Sourcing • Group Selling • Reefer Cold-Chain Optimization</p>
      </footer>
    </div>
  );
}
