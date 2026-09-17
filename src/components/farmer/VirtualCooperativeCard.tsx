'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Package, 
  Plus,
  Radio,
  Clock
} from 'lucide-react';
import { FarmerCluster } from '@/types/cluster';
import { BulkBuyerMatchModal } from './BulkBuyerMatchModal';

interface VirtualCooperativeCardProps {
  cluster: FarmerCluster;
  onContributeClick?: (cluster: FarmerCluster) => void;
  showAllDetails?: boolean;
}

export function VirtualCooperativeCard({
  cluster,
  onContributeClick,
  showAllDetails = true,
}: VirtualCooperativeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const targetKg = cluster.targetBulkKg || 1000;
  const currentKg = cluster.currentQuantityKg || 0;
  const percentTowardTarget = Math.round((currentKg / targetKg) * 100);
  const tonnesAvailable = (currentKg / 1000).toFixed(2);
  const targetTonnes = (targetKg / 1000).toFixed(1);

  const isMatchReady =
    cluster.status === 'Bulk Buyer Matching Active' ||
    cluster.status === 'Bulk Buyer Match Ready' ||
    currentKg >= targetKg;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
        
        {/* Top Header Row */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mb-1">
                  Virtual Cooperative
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {cluster.name}
                </h3>
              </div>
            </div>

            {/* Matching Status Badge */}
            <div className="shrink-0 text-right">
              {isMatchReady ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Bulk Buyer Matching Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Consolidating Volume</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-slate-100 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Farmers</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">
                {cluster.activeFarmersCount} Farmers
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Radius</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">
                {cluster.radiusKm} km radius
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Crop</span>
              <span className="text-sm font-black text-emerald-700 truncate block mt-0.5">
                {cluster.commodity}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Listings</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">
                {cluster.activeListingsCount} listings
              </span>
            </div>
          </div>
        </div>

        {/* Progress Toward Bulk Target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-extrabold text-slate-900 text-sm">
                {tonnesAvailable} tonnes available
              </span>
              <span className="text-slate-500 ml-1">
                ({currentKg.toLocaleString()} kg)
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Target: </span>
              <span className="font-extrabold text-slate-900">{targetTonnes} tonne</span>
              <span className="text-slate-400 text-[11px]"> ({targetKg.toLocaleString()} kg)</span>
            </div>
          </div>

          {/* Animated Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMatchReady
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}
              style={{ width: `${Math.min(100, percentTowardTarget)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className={`font-extrabold ${isMatchReady ? 'text-emerald-700' : 'text-amber-700'}`}>
              {percentTowardTarget}% toward target
            </span>
            <span className="text-slate-400">
              {isMatchReady ? '✓ Threshold Exceeded' : `${(targetKg - currentKg).toLocaleString()} kg remaining`}
            </span>
          </div>
        </div>

        {/* Privacy-Preserved Participating Farmer Contributions */}
        {showAllDetails && cluster.inventory && cluster.inventory.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cluster Contributions (Privacy Preserved):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {cluster.inventory.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                >
                  <span className="font-bold text-slate-900 truncate block">
                    {item.farmerDisplayName}
                  </span>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="font-extrabold text-emerald-700">{item.quantityKg} kg</span>
                    <span className="text-slate-400">{item.qualityGrade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {/* Main Requested CTA: "Find Bulk Buyers" */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Find Bulk Buyers</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary CTA: Contribute Produce */}
          {onContributeClick && (
            <button
              type="button"
              onClick={() => onContributeClick(cluster)}
              className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Contribute Produce</span>
            </button>
          )}

          <Link
            href="/farmer/clusters"
            className="w-full sm:w-auto py-3 px-4 text-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            View Map &amp; Full Cluster
          </Link>
        </div>

      </div>

      {/* Bulk Buyer Match Modal */}
      <BulkBuyerMatchModal
        cluster={cluster}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
