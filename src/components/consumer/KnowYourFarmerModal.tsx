'use client';
import React from 'react';
import { Modal } from '@/components/common/Modal';
import { FarmerStory } from '@/types/consumer';
import { ShieldCheck, MapPin, Calendar, Sprout, Heart, CheckCircle2, User } from 'lucide-react';

interface KnowYourFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerStory: FarmerStory | null;
}

export function KnowYourFarmerModal({
  isOpen,
  onClose,
  farmerStory,
}: KnowYourFarmerModalProps) {
  if (!farmerStory) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Know Your Farmer & FPO Transparency"
      subtitle="Verified direct farm provenance • Zero middleman exploitation"
      maxWidth="xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 border-2 border-emerald-500/50">
            <img
              src={farmerStory.farmerPhoto}
              alt={farmerStory.farmerName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">{farmerStory.farmerName}</h4>
              <span className="text-[10p] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Verified FPO
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{farmerStory.farmOrFpoName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {farmerStory.generalLocation}, {farmerStory.state}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Harvest Time
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{farmerStory.harvestDate}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Cultivated Area
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{farmerStory.totalAcresGrown}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Primary Crops
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{farmerStory.mainCrops.join(', ')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Farm Story & Produce Provenance</h5>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {farmerStory.story}
          </p>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Agricultural & Soil Practices</h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-slate-900 dark:text-white">Soil Enrichment:</strong> {farmerStory.soilPractices}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-slate-900 dark:text-white">Natural & IPM Practices:</strong> {farmerStory.organicPractices}</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-600/30 rounded-2xl flex items-center gap-3">
          <Heart className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-900 dark:text-amber-300 font-medium">
            <strong>Fair Price Guarantee:</strong> {farmerStory.fairPriceCommitment}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default KnowYourFarmerModal;
