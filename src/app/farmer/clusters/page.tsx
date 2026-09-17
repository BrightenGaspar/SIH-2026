'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Sparkles, 
  Plus, 
  MapPin, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  Building2,
  Share2
} from 'lucide-react';
import { clusterService } from '@/services/clusterService';
import { FarmerCluster } from '@/types/cluster';
import { VirtualCooperativeCard } from '@/components/farmer/VirtualCooperativeCard';
import { ClusterMap } from '@/components/farmer/ClusterMap';
import { ContributeProduceModal } from '@/components/farmer/ContributeProduceModal';
import { CreateClusterModal } from '@/components/farmer/CreateClusterModal';
import { useAuth } from '@/context/AuthContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { LowBandwidthBanner } from '@/components/common/LowBandwidthBanner';

export default function FarmerClustersPage() {
  const { user } = useAuth();
  const { isLowBandwidth } = useBandwidth();
  const [clusters, setClusters] = useState<FarmerCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<FarmerCluster | null>(null);

  // Modals state
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clusterToContribute, setClusterToContribute] = useState<FarmerCluster | null>(null);
  const [autoClustering, setAutoClustering] = useState(false);
  const [autoClusterNotice, setAutoClusterNotice] = useState<string | null>(null);

  const loadClusters = async () => {
    try {
      setLoading(true);
      const data = await clusterService.getClusters();
      setClusters(data);
      if (data.length > 0) {
        setSelectedCluster(data[0]);
      }
    } catch (err) {
      console.error('Failed to load clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const handleContributeClick = (cluster: FarmerCluster) => {
    setClusterToContribute(cluster);
    setIsContributeModalOpen(true);
  };

  const handleContributeSuccess = (updatedCluster: FarmerCluster) => {
    setClusters((prev) =>
      prev.map((c) => (c.id === updatedCluster.id ? updatedCluster : c))
    );
    setSelectedCluster(updatedCluster);
  };

  const handleCreateSuccess = (newCluster: FarmerCluster) => {
    setClusters((prev) => [newCluster, ...prev]);
    setSelectedCluster(newCluster);
  };

  // Quick 1-Click Auto-Clustering Demonstration
  const handleAutoClusterMyProduce = async () => {
    setAutoClustering(true);
    try {
      const res = await clusterService.autoClusterProduce({
        farmerId: user?.id || 'farmer-user-current',
        farmerName: user?.name || 'Ramesh Patel',
        farmerPlace: user?.place || 'Shadnagar',
        farmerArea: user?.area || 'Farooqnagar Sector 1',
        crop: 'Tomato (Hybrid Desi)',
        quantityKg: 250,
        qualityGrade: 'Grade A',
        expectedPrice: 28.5,
        radiusKm: 5.0,
        targetBulkKg: 1000.0,
      });

      setAutoClusterNotice(res.message);
      await loadClusters();
      setTimeout(() => setAutoClusterNotice(null), 5000);
    } catch (err) {
      console.error('Auto cluster failed:', err);
    } finally {
      setAutoClustering(false);
    }
  };

  // Aggregate Metrics across all clusters
  const totalVolumeKg = clusters.reduce((sum, c) => sum + (c.currentQuantityKg || 0), 0);
  const totalFarmers = clusters.reduce((sum, c) => sum + (c.activeFarmersCount || 0), 0);
  const readyClusters = clusters.filter((c) => c.status === 'Bulk Buyer Matching Active' || c.currentQuantityKg >= c.targetBulkKg).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <LowBandwidthBanner role="farmer" />

      {/* 1. PAGE HEADER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
              Smart Farmer Clustering
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-semibold">5 km Virtual Cooperatives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Virtual Cooperative &amp; Pooling
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Aggregate small individual farm yields within a 5 km radius to meet 1-tonne bulk buyer demand orders and share cold reefer transport costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoClusterMyProduce}
            disabled={autoClustering}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{autoClustering ? 'Clustering...' : 'Auto-Cluster Produce'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Form Cooperative</span>
          </button>
        </div>
      </div>

      {/* Auto Cluster Alert Notice */}
      {autoClusterNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{autoClusterNotice}</span>
        </div>
      )}

      {/* 2. KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">Active Cooperatives</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{clusters.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">{readyClusters} Match Ready</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">Aggregated Volume</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {(totalVolumeKg / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">Tonnes</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">{totalVolumeKg.toLocaleString()} kg total</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">Cooperating Farmers</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalFarmers}</span>
          <span className="text-[11px] text-blue-600 font-semibold">Within 5 km radius</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">Logistics Savings</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">38%</span>
          <span className="text-[11px] text-slate-500 font-semibold">Shared Reefer freight</span>
        </div>
      </div>

      {/* 3. CLUSTERS LISTING & CARD SECTION */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
          <span>Loading Virtual Cooperatives...</span>
        </div>
      ) : clusters.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Clusters Formed Yet</h3>
          <p className="text-xs text-slate-500">Click &ldquo;Form Cooperative&rdquo; or &ldquo;Auto-Cluster Produce&rdquo; to begin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Primary Cluster Card (Exact Prompt Specification) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Active 5 km Cooperatives</span>
              </h2>
              <span className="text-xs text-slate-500">Select cluster to inspect details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {clusters.map((cluster) => (
                <div 
                  key={cluster.id}
                  onClick={() => setSelectedCluster(cluster)}
                  className={`cursor-pointer transition-all ${
                    selectedCluster?.id === cluster.id ? 'ring-2 ring-emerald-500 rounded-3xl' : ''
                  }`}
                >
                  <VirtualCooperativeCard
                    cluster={cluster}
                    onContributeClick={handleContributeClick}
                    showAllDetails={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 4. DETAIL SPLIT: 5 KM MAP + INVENTORY & EVENTS AUDIT */}
          {selectedCluster && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              
              {/* Selected Cluster Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {selectedCluster.name} &bull; Geofence &amp; Inventory Ledger
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                      {selectedCluster.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hub Coordinates: {selectedCluster.centerLat.toFixed(4)}, {selectedCluster.centerLng.toFixed(4)} &bull; {selectedCluster.centerPlace}, {selectedCluster.centerDistrict}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleContributeClick(selectedCluster)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Produce to Cluster</span>
                </button>
              </div>

              {/* Cluster Map Display */}
              <ClusterMap cluster={selectedCluster} />

              {/* 2-Column Split: Participating Listings (Privacy Safe) + Cluster Events */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                
                {/* Left: Contributing Listings Ledger */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Participating Produce Listings ({selectedCluster.inventory?.length || 0})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Anonymized for privacy</span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 text-xs">
                    {(selectedCluster.inventory || []).map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-white transition-colors">
                        <div>
                          <span className="font-bold text-slate-900 block">{item.farmerDisplayName}</span>
                          <span className="text-[11px] text-slate-500">
                            {item.cropName} &bull; <strong className="text-emerald-700">{item.qualityGrade}</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">
                            {item.quantityKg.toLocaleString()} kg
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ₹{item.askingPricePerKg.toFixed(2)}/kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Cluster Timeline & Buyer Events */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>Cluster Events &amp; Buyer Notifications</span>
                  </h4>

                  <div className="space-y-2.5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 text-xs">
                    {(selectedCluster.events && selectedCluster.events.length > 0) ? (
                      selectedCluster.events.map((evt) => (
                        <div key={evt.id} className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{evt.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {evt.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No events logged yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {clusterToContribute && (
        <ContributeProduceModal
          cluster={clusterToContribute}
          isOpen={isContributeModalOpen}
          onClose={() => setIsContributeModalOpen(false)}
          onSuccess={handleContributeSuccess}
        />
      )}

      <CreateClusterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreateSuccess}
      />
    </div>
  );
}
