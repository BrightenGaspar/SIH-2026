'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { consumerService } from '@/services/consumerService';
import { ProductDetails, ConsumerOrder, Recommendation, BulkDemand } from '@/types/consumer';
import { 
  Store, 
  Package, 
  Truck, 
  TrendingDown, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  MapPin,
  Search,
  ShoppingCart
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function ConsumerDashboard() {
  const { consumerUser } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bulkDemands, setBulkDemands] = useState<BulkDemand[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'demands'>('overview');

  // New Demand Post Form Modal State
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [newProduceName, setNewProduceName] = useState('Tomato');
  const [newRequiredKg, setNewRequiredKg] = useState(5000);
  const [demandCreated, setDemandCreated] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [prodList, orderList, recList, demandList] = await Promise.all([
        consumerService.getProducts(),
        consumerService.getOrders(),
        consumerService.getRecommendations(consumerUser?.buyerType),
        consumerService.getBulkDemands()
      ]);
      setProducts(prodList);
      setOrders(orderList);
      setRecommendations(recList);
      setBulkDemands(demandList);
    }
    loadData();
  }, [consumerUser]);

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  const sihHighlightOrder = orders.find(o => o.id === 'ORD-HYD-5000') || orders[0];

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await consumerService.createBulkDemand({
      buyerId: consumerUser?.id || 'consumer-001',
      produceName: newProduceName,
      requiredQuantityKg: newRequiredKg,
      matchedQuantityKg: 0,
      remainingQuantityKg: newRequiredKg,
      requiredGrade: 'A',
      deliveryLocation: consumerUser?.location || 'Bowenpally Hub, Hyderabad',
      deliveryCity: 'Hyderabad',
      preferredDeliveryDate: 'Tomorrow Morning (06:00 - 09:00 AM)',
      deliveryWindow: 'Early Morning Slot',
      maxBudgetPerKg: 28,
      matchedSuppliers: [],
      roadRouteDetails: { traditionalDistanceKm: 60, traditionalCost: 2400, traditionalHours: 2.5, optimizedDistanceKm: 42, optimizedCost: 1600, optimizedHours: 1.5, distanceSavedKm: 18, costSavedINR: 800, hoursSaved: 1.0 },
    });

    setBulkDemands([created, ...bulkDemands]);
    setDemandCreated(true);
    setTimeout(() => {
      setShowDemandModal(false);
      setDemandCreated(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Buyer Procurement Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome back, {consumerUser?.name || 'Valued Buyer'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 mt-1 max-w-2xl">
              Source farm-fresh perishable produce directly from aggregated farmer clusters with guaranteed cold-chain logistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDemandModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" /> Post Custom Bulk Demand
            </button>
            <Link
              href="/consumer/marketplace"
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-emerald-400" /> Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Procurement Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('demands')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'demands'
              ? 'bg-emerald-600 text-white'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Bulk Demands ({bulkDemands.length})
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-semibold">Active In-Transit Orders</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{activeOrders.length}</span>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-semibold">Completed Orders</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">{completedOrders.length}</span>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-semibold">Posted Demands</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-1 block">{bulkDemands.length}</span>
            </div>
          </div>

          {/* Live Highway GPS Tracking Featured Widget */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 p-6 md:p-8 rounded-3xl border border-emerald-500/30 text-white shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Truck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Live Delivery Tracking by GPS
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Satellite Connected
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Consolidated Farm Dispatch • TRK-CONS-ROAD-9021
                  </h3>
                </div>
              </div>

              <Link
                href="/consumer/tracking?id=TRK-CONS-ROAD-9021"
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0"
              >
                <MapPin className="w-4 h-4" /> Open Full GPS Tracking Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">Current Highway Position</span>
                <strong className="text-white text-sm block">Shamshabad ORR Tollway</strong>
                <span className="text-emerald-400 font-mono text-[11px] block">17.2403° N, 78.4294° E</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">Carrier & Driver</span>
                <strong className="text-white text-sm block">Tata 407 Reefer</strong>
                <span className="text-zinc-300 text-[11px] block">Mohammed Ismail (TS 08 UB 4192)</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">IoT Reefer Cold Chain</span>
                <strong className="text-emerald-400 text-sm block">5.8°C (Optimal Range)</strong>
                <span className="text-zinc-300 text-[11px] block">Humidity: 86% • Low Spoilage Risk</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-1">
                <span className="text-zinc-400 text-[11px] block">Target Arrival (ETA)</span>
                <strong className="text-white text-sm block">Today, 05:45 PM</strong>
                <span className="text-emerald-400 font-bold text-[11px] block">28 km Remaining (45 mins)</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Shadnagar FPO Hub (Origin)</span>
                <span className="font-bold text-white">68% Journey Completed</span>
                <span>Bowenpally Terminal (Destination)</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[68%] transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-zinc-900 dark:text-white">{order.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {order.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live GPS Active
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {order.totalQuantityKg.toLocaleString('en-IN')} kg • ₹{order.totalAmount.toLocaleString('en-IN')} • Expected {order.estimatedDeliveryDate}
                </p>
              </div>

              <Link
                href={`/consumer/tracking/${order.logisticsId || 'TRK-CONS-ROAD-9021'}`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Truck className="w-3.5 h-3.5" /> Track Live GPS Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'demands' && (
        <div className="space-y-4">
          {bulkDemands.map((demand) => (
            <div
              key={demand.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <span className="text-xs font-mono font-bold text-zinc-400">{demand.id}</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                  {demand.produceName} ({demand.requiredQuantityKg} kg)
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Delivery to: {demand.deliveryLocation} • Status: <span className="text-emerald-600 font-bold">{demand.status}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Matched Volume</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {demand.matchedQuantityKg} / {demand.requiredQuantityKg} kg ({Math.round((demand.matchedQuantityKg / demand.requiredQuantityKg) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demand Modal */}
      {showDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">Post Custom Bulk Demand</h3>
            <form onSubmit={handleCreateDemand} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1">Produce Commodity</label>
                <input
                  type="text"
                  value={newProduceName}
                  onChange={(e) => setNewProduceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1">Required Quantity (kg)</label>
                <input
                  type="number"
                  value={newRequiredKg}
                  onChange={(e) => setNewRequiredKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm font-semibold"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemandModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg"
                >
                  {demandCreated ? 'Created!' : 'Publish Demand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}