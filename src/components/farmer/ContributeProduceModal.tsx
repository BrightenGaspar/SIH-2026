'use client';

import React, { useState } from 'react';
import { X, Sprout, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { FarmerCluster } from '@/types/cluster';
import { clusterService } from '@/services/clusterService';
import { useAuth } from '@/context/AuthContext';

interface ContributeProduceModalProps {
  cluster: FarmerCluster;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCluster: FarmerCluster) => void;
}

export function ContributeProduceModal({
  cluster,
  isOpen,
  onClose,
  onSuccess,
}: ContributeProduceModalProps) {
  const { user } = useAuth();
  const [quantityKg, setQuantityKg] = useState<number>(250);
  const [qualityGrade, setQualityGrade] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A');
  const [askingPrice, setAskingPrice] = useState<number>(28.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityKg <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await clusterService.autoClusterProduce({
        farmerId: user?.id || `farmer-${Date.now()}`,
        farmerName: user?.name || 'Local Farmer',
        farmerPlace: user?.place || cluster.centerPlace,
        farmerArea: user?.area || 'Sector 2',
        crop: cluster.commodity,
        quantityKg: Number(quantityKg),
        qualityGrade,
        expectedPrice: Number(askingPrice),
        radiusKm: cluster.radiusKm,
        targetBulkKg: cluster.targetBulkKg,
      });

      setSuccessMessage(res.message);
      setTimeout(() => {
        onSuccess(res.cluster);
        setIsSubmitting(false);
        setSuccessMessage(null);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to contribute to cluster:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Contribute to Cooperative</h3>
              <p className="text-xs text-emerald-200 truncate">{cluster.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Commodity / Crop
            </label>
            <input
              type="text"
              readOnly
              value={cluster.commodity}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity to Contribute (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="10"
                required
                value={quantityKg}
                onChange={(e) => setQuantityKg(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-emerald-600"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Currently available in cluster: {cluster.currentQuantityKg.toLocaleString()} kg / {cluster.targetBulkKg.toLocaleString()} kg target
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:outline-emerald-600 bg-white"
              >
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Processing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asking Price (₹/kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  step="0.5"
                  required
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:outline-emerald-600"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">₹/kg</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
            <span className="font-bold block">Privacy Guaranteed:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your exact farm address and phone number are hidden. Other cluster members and buyers will only see your anonymized alias (e.g. <em>Farmer (Shadnagar)</em>) and contributed volume.
            </p>
          </div>

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantityKg <= 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Pledge to Cluster'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
