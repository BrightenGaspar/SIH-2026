'use client';

import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Truck, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  MapPin,
  Clock,
  Send
} from 'lucide-react';
import { FarmerCluster, BulkBuyerMatch } from '@/types/cluster';
import { formatINR } from '@/lib/utils';

interface BulkBuyerMatchModalProps {
  cluster: FarmerCluster;
  isOpen: boolean;
  onClose: () => void;
  onSelectBuyer?: (buyer: BulkBuyerMatch) => void;
}

export function BulkBuyerMatchModal({
  cluster,
  isOpen,
  onClose,
  onSelectBuyer,
}: BulkBuyerMatchModalProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(
    cluster.matches?.[0]?.buyerId || null
  );
  const [isNotified, setIsNotified] = useState(false);

  if (!isOpen) return null;

  const matches = cluster.matches || [];
  const selectedBuyer = matches.find((m) => m.buyerId === selectedBuyerId) || matches[0];

  const handleNotify = () => {
    setIsNotified(true);
    if (selectedBuyer && onSelectBuyer) {
      onSelectBuyer(selectedBuyer);
    }
  };

  const tonnes = (cluster.currentQuantityKg / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white shadow-xs border border-white/20">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300/30">
                  Bulk Buyer Match Ready
                </span>
                <span className="text-xs text-emerald-200 font-mono">
                  {tonnes} Tonnes ({cluster.currentQuantityKg.toLocaleString()} kg)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Matched Buyers: {cluster.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Cluster Value Proposition Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Farmer Uplift</span>
                <span className="text-sm font-black text-emerald-700 block">+28% to +38%</span>
                <span className="text-[10px] text-slate-500">vs local mandi rate</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Logistics Consolidation</span>
                <span className="text-sm font-black text-blue-700 block">Tata 407 Reefer</span>
                <span className="text-[10px] text-slate-500">38% shared freight cut</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Bulk Threshold</span>
                <span className="text-sm font-black text-amber-700 block">1,000 kg Target Met</span>
                <span className="text-[10px] text-slate-500">Aggregated within 5 km</span>
              </div>
            </div>
          </div>

          {/* Buyer Candidates List */}
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Available Institutional Buyers ({matches.length})</span>
            </h3>

            <div className="space-y-3">
              {matches.map((m) => {
                const isSelected = m.buyerId === selectedBuyerId;
                const totalEstimatedPayout = Math.round(cluster.currentQuantityKg * m.offeredPricePerKg);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedBuyerId(m.buyerId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{m.buyerName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {m.buyerType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{m.destinationHub}</span>
                          <span>&bull;</span>
                          <span>{m.distanceKm} km away</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-xs text-slate-500 block">Offered Rate</span>
                          <span className="text-lg font-black text-emerald-700">₹{m.offeredPricePerKg.toFixed(2)}/kg</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                        <div>
                          <span className="text-xs text-slate-500 block">Cluster Payout</span>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatINR(totalEstimatedPayout)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{m.pickupOffered ? 'Farmgate Reefer Pickup' : 'Hub Drop-off'}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Payment: {m.paymentTermsDays === 0 ? 'Instant UPI' : `${m.paymentTermsDays} Days`}</span>
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                        Match Score: {m.matchScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Buyer Dispatch Summary */}
          {selectedBuyer && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Recommended Logistics Dispatch
                </span>
                <span className="text-xs text-slate-400 font-mono">Consolidated Cluster Dispatch</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dispatch <strong>{cluster.currentQuantityKg.toLocaleString()} kg</strong> of {cluster.commodity} from the 5 km radius cluster to <strong>{selectedBuyer.buyerName}</strong> ({selectedBuyer.destinationHub}) using a single dedicated <strong>{selectedBuyer.recommendedVehicle}</strong>.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Shared Road Freight Savings:</span>
                <span className="text-emerald-400 font-bold">~₹4.50 / kg saved for each participating farmer</span>
              </div>
            </div>
          )}

          {/* Success Banner if Notified */}
          {isNotified && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block">Buyer Notification Sent!</span>
                <span className="text-[11px] text-emerald-700">
                  {selectedBuyer?.buyerName} has been alerted to the {tonnes} tonne cluster consignment at {cluster.centerPlace}. Reefer dispatch details will be shared.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {cluster.activeFarmersCount} farmers cooperating within {cluster.radiusKm} km
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleNotify}
              disabled={isNotified}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isNotified ? 'Notification Sent' : 'Notify Bulk Buyer'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
