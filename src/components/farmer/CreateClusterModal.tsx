'use client';

import React, { useState } from 'react';
import { X, Users, Plus, CheckCircle2 } from 'lucide-react';
import { clusterService } from '@/services/clusterService';
import { FarmerCluster } from '@/types/cluster';
import { useAuth } from '@/context/AuthContext';

interface CreateClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (cluster: FarmerCluster) => void;
}

export function CreateClusterModal({
  isOpen,
  onClose,
  onCreated,
}: CreateClusterModalProps) {
  const { user } = useAuth();
  const [commodity, setCommodity] = useState('Tomato (Hybrid Desi)');
  const [centerPlace, setCenterPlace] = useState(user?.place || 'Shadnagar');
  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [targetBulkKg, setTargetBulkKg] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const name = `${commodity.split(' ')[0]} Cluster — ${centerPlace}`;
      const newCluster = await clusterService.createCluster({
        name,
        commodity,
        centerPlace,
        centerDistrict: user?.district || 'Ranga Reddy',
        centerState: user?.state || 'Telangana',
        radiusKm: Number(radiusKm),
        targetBulkKg: Number(targetBulkKg),
        creatorFarmerId: user?.id,
      });

      onCreated(newCluster);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Failed to create cluster:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create Virtual Cooperative</h3>
              <p className="text-xs text-emerald-200">Form a new 5 km farmer cluster</p>
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
              Crop / Commodity
            </label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:outline-emerald-600 bg-white"
            >
              <option value="Tomato (Hybrid Desi)">Tomato (Hybrid Desi)</option>
              <option value="Onion (Nashik Red)">Onion (Nashik Red)</option>
              <option value="Green Chilli (G4)">Green Chilli (G4)</option>
              <option value="Potato (Jyoti)">Potato (Jyoti)</option>
              <option value="Banana (Robusta)">Banana (Robusta)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cluster Center Hub (Town / Area)
            </label>
            <input
              type="text"
              required
              value={centerPlace}
              onChange={(e) => setCenterPlace(e.target.value)}
              placeholder="e.g. Shadnagar, Kothur, Chevella"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:outline-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cluster Radius (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="25"
                  step="1"
                  required
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-emerald-600"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">km</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bulk Target (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  max="20000"
                  step="100"
                  required
                  value={targetBulkKg}
                  onChange={(e) => setTargetBulkKg(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-emerald-600"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kg</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">How Clustering Works:</span>
            <p className="text-[11px] leading-relaxed">
              Nearby farmers with compatible produce within the {radiusKm} km radius will automatically discover and aggregate into this cluster to unlock bulk buyer pricing once the {(targetBulkKg / 1000).toFixed(1)} tonne threshold is reached.
            </p>
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Establishing...' : 'Establish Cooperative'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
