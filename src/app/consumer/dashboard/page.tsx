'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { consumerService } from '@/services/consumerService';
import { supabase } from '@/lib/supabase';
import { ProductDetails, ConsumerOrder, Recommendation, BulkDemand } from '@/types/consumer';
import { LowBandwidthBanner } from '@/components/common/LowBandwidthBanner';
import { LazyMap } from '@/components/maps/LazyMap';
import { 
  Store, 
  Package, 
  Truck, 
  Plus, 
  MapPin, 
  Search, 
  ShoppingCart, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Radio, 
  RefreshCw, 
  Sparkles, 
  Check, 
  ShieldCheck,
  Wheat,
  Apple,
  Carrot,
  Flame,
  Tag
} from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { getAvailableSubCategories, matchesSubCategory } from '@/lib/categoryHelpers';

export default function ConsumerDashboard() {
  const { user, consumerUser } = useAuth();
  const { addToCart } = useCart();
  const { isLowBandwidth } = useBandwidth();

  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bulkDemands, setBulkDemands] = useState<BulkDemand[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'demands'>('overview');

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  // Modal State
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [newProduceName, setNewProduceName] = useState('Tomato (Hybrid)');
  const [newRequiredKg, setNewRequiredKg] = useState(2500);
  const [demandCreated, setDemandCreated] = useState(false);

  // Added to cart notification indicator
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Manual refresh state for Low Bandwidth
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // Real user display name (NEVER hardcode reference demo names)
  const displayName =
    consumerUser?.name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Valued Buyer');

  const locationText = consumerUser?.location || user?.location || 'Hyderabad Hub, Telangana';

  const loadData = async () => {
    try {
      const [prodList, orderList, recList, demandList] = await Promise.all([
        consumerService.getProducts(),
        consumerService.getOrders(),
        consumerService.getRecommendations(consumerUser?.buyerType),
        consumerService.getBulkDemands(),
      ]);
      setProducts(prodList || []);
      setOrders(orderList || []);
      setRecommendations(recList || []);
      setBulkDemands(demandList || []);
    } catch (err) {
      console.error('Failed to load consumer dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // In Low Bandwidth mode, avoid real-time websocket subscription to conserve data
    if (isLowBandwidth) return;

    const channel = supabase
      .channel('realtime-consumer-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produce_listings' },
        async () => {
          const prodList = await consumerService.getProducts();
          setProducts(prodList || []);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          const orderList = await consumerService.getOrders();
          setOrders(orderList || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consumerUser, isLowBandwidth]);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    await loadData();
    setTimeout(() => setManualRefreshing(false), 500);
  };

  const handleAddToCart = (product: ProductDetails) => {
    addToCart(product, 50); // Default order step: 50 kg wholesale or base quantity
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await consumerService.createBulkDemand({
      buyerId: consumerUser?.id || user?.id || 'consumer-001',
      produceName: newProduceName,
      requiredQuantityKg: newRequiredKg,
      matchedQuantityKg: 0,
      remainingQuantityKg: newRequiredKg,
      requiredGrade: 'A',
      deliveryLocation: locationText,
      deliveryCity: 'Hyderabad',
      preferredDeliveryDate: 'Tomorrow Morning (06:00 - 09:00 AM)',
      deliveryWindow: 'Early Morning Slot',
      maxBudgetPerKg: 28,
      matchedSuppliers: [],
      roadRouteDetails: {
        traditionalDistanceKm: 60,
        traditionalCost: 2400,
        traditionalHours: 2.5,
        optimizedDistanceKm: 42,
        optimizedCost: 1600,
        optimizedHours: 1.5,
        distanceSavedKm: 18,
        costSavedINR: 800,
        hoursSaved: 1.0,
      },
    });

    setBulkDemands([created, ...bulkDemands]);
    setDemandCreated(true);
    setTimeout(() => {
      setShowDemandModal(false);
      setDemandCreated(false);
    }, 1500);
  };

  // Available sub-categories for selected category
  const subCategories = useMemo(() => {
    const items = products.map((p) => ({
      crop_name: p.name,
      variety: p.description,
      category: p.category,
    }));
    return getAvailableSubCategories(selectedCategory, items);
  }, [selectedCategory, products]);

  // Filter products by search, category, and subcategory
  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSub =
      selectedSubCategory === 'all' ||
      matchesSubCategory(
        { crop_name: item.name, variety: item.description, category: item.category },
        selectedCategory,
        selectedSubCategory
      );
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSub && matchesSearch;
  });

  const activeOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const completedOrders = orders.filter((o) => o.status === 'Delivered');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. LOW BANDWIDTH MODE BANNER */}
      <LowBandwidthBanner role="consumer" />

      {/* 2. WELCOME HEADER (Matching reference visual replica) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Buyer Procurement Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500">{locationText}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Welcome, {displayName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Find fresh and quality produce directly from local verified farmers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isLowBandwidth && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={manualRefreshing}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', manualRefreshing && 'animate-spin')} />
              <span>{manualRefreshing ? 'Refreshing...' : 'Manual Refresh'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDemandModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Bulk Demand</span>
          </button>

          <Link href="/consumer/marketplace">
            <button
              type="button"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Marketplace</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 3. SEARCH BAR & CATEGORY PILLS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search for products, farms, varieties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { name: 'All', icon: Sparkles },
            { name: 'Vegetables', icon: Carrot },
            { name: 'Fruits', icon: Apple },
            { name: 'Grains', icon: Wheat },
            { name: 'Spices', icon: Flame },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubCategory('all');
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-white' : 'text-slate-500')} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Category Filter Pills */}
        {subCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              <Tag className="w-3 h-3 text-blue-500" />
              <span>Sub-categories:</span>
            </div>
            {subCategories.map((sub: { id: string; label: string; count: number }) => {
              const isSelected = selectedSubCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0',
                    isSelected
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span>{sub.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isSelected ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. 3 KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Deliveries</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeOrders.length}</div>
          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
            <Radio className="w-3 h-3 animate-pulse" /> Live GPS in transit
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Completed Orders</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{completedOrders.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            100% Quality inspected
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Posted Bulk Demands</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{bulkDemands.length}</div>
          <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-1">
            Cluster-aggregated supply
          </span>
        </div>
      </div>

      {/* 5. TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          Procurement Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('demands')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'demands'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          Bulk Demands ({bulkDemands.length})
        </button>
      </div>

      {/* 6. TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* HERO BANNER (Normal Mode only - deferred in Low Bandwidth to save data) */}
          {!isLowBandwidth && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 max-w-xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Quality Guaranteed &bull; Cold-Chain Assured
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Fresh Produce From Local Farmers
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Order directly from verified farm clusters. Transparent farm gate pricing, real-time IoT temperature logging, and guaranteed next-day delivery.
                </p>
                <div className="pt-2">
                  <Link href="/consumer/marketplace">
                    <button
                      type="button"
                      className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-blue-600" />
                      <span>Explore Full Marketplace</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* POPULAR PRODUCTS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {isLowBandwidth ? 'Popular Products (Text Only)' : 'Popular Products'}
                </h3>
                {isLowBandwidth && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-600" /> Text Mode Active
                  </span>
                )}
              </div>
              <Link
                href="/consumer/marketplace"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* DUAL-MODE PRODUCTS PRESENTATION */}
            {isLowBandwidth ? (
              /* LOW BANDWIDTH MODE: Clean Text-Only Table (No image requests) */
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Origin / Farm</th>
                        <th className="py-3 px-4">Available Qty</th>
                        <th className="py-3 px-4">Price / kg</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.slice(0, 8).map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{product.name}</span>
                            <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                              Grade {product.grade || 'A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {product.farmerStory?.farmOrFpoName || product.location}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {product.availableQuantityKg?.toLocaleString('en-IN') || 500} kg
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-blue-600">
                              ₹{product.pricePerKg}/kg
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            >
                              {addedItem === product.id ? (
                                <>
                                  <Check className="w-3 h-3 text-white" /> Added
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3" /> Add
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No produce found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* NORMAL MODE: Visual Card Grid with Photos */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProducts.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Image / Visual */}
                      <div className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden relative mb-3 border border-slate-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                            <Store className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 text-blue-700 text-[10px] font-bold backdrop-blur-xs shadow-xs">
                          Grade {product.grade || 'A'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {product.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {product.farmerStory?.farmOrFpoName || product.location}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Pricing and Action */}
                    <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Price</span>
                        <span className="text-base font-black text-blue-600">
                          ₹{product.pricePerKg}
                          <span className="text-xs text-slate-500 font-normal">/kg</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        {addedItem === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl">
                    <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search keywords or category filters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. FEATURED IN-TRANSIT DELIVERY TRACKING (Dual-Mode LazyMap) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Live Delivery Tracking
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Satellite GPS Connected
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    Consolidated Farm Dispatch &bull; TRK-CONS-ROAD-9021
                  </h3>
                </div>
              </div>

              <Link
                href="/consumer/tracking/TRK-CONS-ROAD-9021"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <MapPin className="w-3.5 h-3.5" /> Full GPS Tracking <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-semibold">Current Position</span>
                <strong className="text-slate-900 text-xs block">Shamshabad ORR Tollway</strong>
                <span className="text-blue-600 font-mono text-[10px] block">17.2403&deg; N, 78.4294&deg; E</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-semibold">Carrier & Vehicle</span>
                <strong className="text-slate-900 text-xs block">Tata 407 Reefer</strong>
                <span className="text-slate-600 text-[10px] block">Mohammed Ismail (TS 08 UB 4192)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-semibold">IoT Cold Chain</span>
                <strong className="text-emerald-600 text-xs block">5.8&deg;C (Optimal Range)</strong>
                <span className="text-slate-600 text-[10px] block">Humidity: 86% &bull; Low Spoilage</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-slate-400 text-[10px] block font-semibold">Target Arrival (ETA)</span>
                <strong className="text-slate-900 text-xs block">Today, 05:45 PM</strong>
                <span className="text-blue-600 font-bold text-[10px] block">28 km Remaining (45 mins)</span>
              </div>
            </div>

            {/* Journey Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Shadnagar FPO Hub (Origin)</span>
                <span className="font-bold text-slate-900">68% Journey Completed</span>
                <span>Bowenpally Terminal (Destination)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-[68%] transition-all duration-500" />
              </div>
            </div>

            {/* Dual-Mode Route View */}
            <div className="pt-2">
              <LazyMap
                vehicleId="TRK-CONS-ROAD-9021"
                origin="Shadnagar Farm Hub"
                destination="Bowenpally Terminal"
                distanceKm={46}
                totalDistanceKm={74}
                status="In Transit"
                role="consumer"
              >
                <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 text-xs">
                  <div className="text-center space-y-1">
                    <MapPin className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="font-semibold text-slate-700 block">Interactive Live GPS Route Map</span>
                    <span className="text-[11px] text-slate-500 block">Live coordinates updating via satellite beacon</span>
                  </div>
                </div>
              </LazyMap>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-slate-900">{order.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {order.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Satellite Tracked
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {order.totalQuantityKg?.toLocaleString('en-IN')} kg &bull; ₹{order.totalAmount?.toLocaleString('en-IN')} &bull; Expected {order.estimatedDeliveryDate}
                </p>
                <p className="text-[11px] text-slate-400">
                  Delivery Destination: {order.deliveryAddress?.city || locationText}
                </p>
              </div>

              <Link
                href={`/consumer/tracking/${order.logisticsId || 'TRK-CONS-ROAD-9021'}`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" /> Track Live GPS Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}

          {activeOrders.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No active in-transit orders</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Browse our marketplace to procure fresh farm produce directly from verified growers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* BULK DEMANDS TAB */}
      {activeTab === 'demands' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900">Custom Procurement Demands</h3>
            <button
              type="button"
              onClick={() => setShowDemandModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Post New Demand
            </button>
          </div>

          {bulkDemands.map((demand) => (
            <div
              key={demand.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-slate-400">{demand.id}</span>
                <h4 className="text-sm font-bold text-slate-900">
                  {demand.produceName} ({demand.requiredQuantityKg?.toLocaleString('en-IN')} kg)
                </h4>
                <p className="text-xs text-slate-500">
                  Destination: {demand.deliveryLocation} &bull; Status:{' '}
                  <span className="text-blue-600 font-bold">{demand.status}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Max Budget: ₹{demand.maxBudgetPerKg}/kg &bull; Required Grade: Grade {demand.requiredGrade}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Matched Volume</span>
                <span className="text-sm font-black text-blue-600 block">
                  {demand.matchedQuantityKg} / {demand.requiredQuantityKg} kg (
                  {Math.round((demand.matchedQuantityKg / (demand.requiredQuantityKg || 1)) * 100)}%)
                </span>
                <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden ml-auto">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((demand.matchedQuantityKg / (demand.requiredQuantityKg || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {bulkDemands.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No custom demands published yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregate your commodity volume and match with farmer clusters at competitive farm-gate rates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* POST BULK DEMAND MODAL */}
      {showDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Post Custom Bulk Demand</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Cluster Matching
              </span>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Produce Commodity
                </label>
                <input
                  type="text"
                  value={newProduceName}
                  onChange={(e) => setNewProduceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Required Quantity (kg)
                </label>
                <input
                  type="number"
                  value={newRequiredKg}
                  onChange={(e) => setNewRequiredKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                  min={50}
                  step={50}
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold block">Smart Route Optimization</span>
                <p className="text-[11px] text-blue-700">
                  AgriFlow will auto-route this demand to certified farmer clusters within 150 km, aggregating cold-chain trucks for maximum freshness.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemandModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-xs cursor-pointer transition"
                >
                  {demandCreated ? 'Demand Published!' : 'Publish Demand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}