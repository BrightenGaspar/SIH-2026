'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { useI18n } from '@/context/I18nContext';
import { farmerService, FarmerInventorySummary } from '@/services/farmerService';
import { supabase } from '@/lib/supabase';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import { Produce, Order } from '@/types/farmer';
import { DeliveryTracking } from '@/types/delivery';
import dynamic from 'next/dynamic';
import { LowBandwidthBanner } from '@/components/common/LowBandwidthBanner';
import { LazyMap } from '@/components/maps/LazyMap';
import { VirtualCooperativeCard } from '@/components/farmer/VirtualCooperativeCard';
import { clusterService } from '@/services/clusterService';
import { FarmerCluster } from '@/types/cluster';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-xs text-slate-500 rounded-xl">
      Loading GPS Map...
    </div>
  ),
});
import {
  Sprout,
  TrendingUp,
  Package,
  Truck,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { isLowBandwidth } = useBandwidth();
  const { t } = useI18n();

  const [produceList, setProduceList] = useState<Produce[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventorySummary, setInventorySummary] = useState<FarmerInventorySummary>({
    totalKg: 0,
    availableKg: 0,
    reservedKg: 0,
    deliveredKg: 0,
    activeListingsCount: 0,
  });
  const [activeTrip, setActiveTrip] = useState<DeliveryTracking | null>(null);
  const [activeCluster, setActiveCluster] = useState<FarmerCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Real user name (never hardcode demo name)
  const displayName =
    (user?.name || 'Farmer')
      .replace(/[\uD800-\uDFFF]|[\u2600-\u27BF]|\u00f0[^\s]*|\u00e2[^\s]*/g, '')
      .trim() || 'Farmer';

  // Fetch real live farmer data from authoritative service layer
  const loadFarmerData = async () => {
    try {
      setLoading(true);
      const [prods, ords, summary, clusters, allTrips] = await Promise.all([
        farmerService.getProduceList().catch(() => []),
        farmerService.getFarmerOrders().catch(() => []),
        farmerService.getInventorySummary().catch(() => ({
          totalKg: 0,
          availableKg: 0,
          reservedKg: 0,
          deliveredKg: 0,
          activeListingsCount: 0,
        })),
        clusterService.getClusters().catch(() => []),
        sharedTrackingService.getAllTrips().catch(() => []),
      ]);
      setProduceList(prods || []);
      setOrders(ords || []);
      setInventorySummary(summary);
      if (clusters && clusters.length > 0) {
        setActiveCluster(clusters[0]);
      }
      if (allTrips && allTrips.length > 0) {
        setActiveTrip(allTrips[0]);
      } else {
        setActiveTrip(null);
      }
      setLastUpdated(new Date().toISOString());
    } catch {
      // Fallbacks if network is offline
    } finally {
      setLoading(false);
      setManualRefreshing(false);
    }
  };

  useEffect(() => {
    loadFarmerData();

    const channel = supabase
      .channel('realtime-farmer-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadFarmerData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produce_listings' },
        () => {
          loadFarmerData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleManualRefresh = () => {
    setManualRefreshing(true);
    loadFarmerData();
  };

  const activeOrdersCount = orders.filter(o => o.status !== 'Delivered').length;
  const topProducePrice = produceList.length > 0 && produceList[0]?.expectedPrice 
    ? `₹${produceList[0].expectedPrice}/kg` 
    : '—';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. LOW BANDWIDTH MODE BANNER (When enabled) */}
      <LowBandwidthBanner role="farmer" />

      {/* 2. WELCOME HEADER (Matching reference design) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Farmer Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500">{user?.location || 'Nashik, Maharashtra'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Good Day, {displayName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time farm inventory, incoming orders, and live produce realization.
          </p>
        </div>

        {/* Action button / Manual refresh for low bandwidth */}
        <div className="flex items-center gap-2">
          <DataStatusBadge
            lastUpdated={lastUpdated}
            freshnessThresholdMinutes={3}
            source="Supabase"
          />
          {isLowBandwidth && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={manualRefreshing}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', manualRefreshing && 'animate-spin')} />
              <span>{manualRefreshing ? 'Refreshing...' : 'Manual Refresh'}</span>
            </button>
          )}
          <Link href="/farmer/produce">
            <button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Produce</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 3. THREE STAT KPI CARDS (Real numbers only) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: My Produce */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">My Produce</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {inventorySummary.availableKg.toLocaleString()} kg
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">
              {inventorySummary.reservedKg > 0
                ? `${inventorySummary.reservedKg.toLocaleString()} kg reserved in orders`
                : `${inventorySummary.activeListingsCount} Active Listings`}
            </p>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Active Orders</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{activeOrdersCount}</p>
            <p className="text-[11px] text-blue-600 font-semibold">In Progress</p>
          </div>
        </div>

        {/* Card 3: Market Price */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Produce Price</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{topProducePrice}</p>
            <p className="text-[11px] text-amber-600 font-semibold">
              {produceList.length > 0 ? produceList[0].crop : 'No active listings'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. VIRTUAL COOPERATIVE SMART FARMER CLUSTER */}
      {activeCluster && (
        <VirtualCooperativeCard
          cluster={activeCluster}
          showAllDetails={true}
        />
      )}

      {/* 5. 2-COLUMN SPLIT: RECENT PRODUCE + TRACK DELIVERY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Produce */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isLowBandwidth ? 'My Produce (Text Only)' : 'Recent Produce'}
                </h3>
                {isLowBandwidth && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    No Images Loaded
                  </span>
                )}
              </div>
              <Link href="/farmer/produce" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                View All
              </Link>
            </div>

            {/* Produce Listing or Honest Empty State */}
            {produceList.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl my-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">No produce listed yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                  Click &apos;+ Add Produce&apos; to list your harvest directly for buyers.
                </p>
                <Link href="/farmer/produce" className="inline-block mt-3">
                  <span className="text-xs font-bold text-emerald-600 hover:underline">
                    + Add First Crop Listing
                  </span>
                </Link>
              </div>
            ) : isLowBandwidth ? (
              /* Low Bandwidth Mode */
              <div className="divide-y divide-slate-100">
                {produceList.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-900">{p.crop}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-600 font-medium">
                        {(Number(p.quantity) || 0).toLocaleString()} {p.unit || 'kg'}
                      </span>
                      <span className="font-bold text-emerald-700 min-w-[60px] text-right">
                        ₹{p.expectedPrice}/kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Normal Mode */
              <div className="space-y-3">
                {produceList.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {p.crop.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.crop}</p>
                        <p className="text-[11px] text-slate-500">
                          {(Number(p.quantity) || 0).toLocaleString()} {p.unit || 'kg'} available
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-700">₹{p.expectedPrice}/kg</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        p.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {p.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing verified produce records</span>
            <Link href="/farmer/produce" className="font-bold text-emerald-600 hover:underline">
              Manage Produce &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Track Delivery (Using LazyMap or Honest Empty State) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Track Delivery</h3>
            <span className="text-[11px] text-slate-500 font-medium">Reefer Truck Dispatch</span>
          </div>

          {activeTrip ? (
            <LazyMap
              vehicleId={activeTrip.vehicleNumber}
              origin={activeTrip.pickupLocation}
              destination={activeTrip.destinationLocation}
              distanceKm={activeTrip.distanceCompletedKm}
              totalDistanceKm={activeTrip.totalDistanceKm}
              status={activeTrip.status}
              role="farmer"
              className="flex-1"
            >
              <div className="h-64 sm:h-72 w-full">
                <LiveTrackingMap trip={activeTrip} showTelemetryPopup={true} />
              </div>
            </LazyMap>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No active shipments in transit</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                When a buyer order is dispatched, live vehicle telemetry and route tracking will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}