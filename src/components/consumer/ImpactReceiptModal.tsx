'use client';
import React from 'react';
import { Modal } from '@/components/common/Modal';
import { ImpactReceipt } from '@/types/consumer';
import { formatINR } from '@/lib/utils';
import { ShieldCheck, Heart, Truck, Sprout, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ImpactReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ImpactReceipt | null;
}

export function ImpactReceiptModal({
  isOpen,
  onClose,
  receipt,
}: ImpactReceiptModalProps) {
  if (!receipt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AgriFlow Impact & Transparency Receipt"
      subtitle="Audited Value Chain Distribution"
      maxWidth="lg"
    >
      <div className="space-y-6">
        <div className="bg-emerald-900/20 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Direct Farmer Realization</span>
            <span className="text-[10p] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">VERIFIED PROVENANCE</span>
          </div>
          <div className="text-3xl font-black text-white">
            {formatINR(receipt.farmerShareTotal)}
          </div>
          <p className="text-xs text-emerald-300">
            +{formatINR(receipt.farmerRealizationGainTotal)} (+
            {receipt.farmerRealizationGainPercent}%) additional income passed directly to cultivating farmers.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">Total Produce Volume</span>
            <span className="font-bold text-white">{receipt.totalQuantityKg} kg</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">Total Amount Paid</span>
            <span className="font-bold text-white">{formatINR(receipt.totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
            <span className="text-slate-400">Road Freight & Cold-Chain Transit</span>
            <span className="font-bold text-white">{formatINR(receipt.roadLogisticsTotal)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">AgriFlow AI Operations & QC</span>
            <span className="font-bold text-white">{formatINR(receipt.platformFeeTotal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Empty Miles Avoided
            </span>
            <p className="text-sm font-bold text-white mt-0.5">{receipt.emptyKmSaved} km</p>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-blue-400" /> Farmers Empowered
            </span>
            <p className="text-sm font-bold text-white mt-0.5">{receipt.directFarmersEmpoweredCount} Farmers / FPO	</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-800/20 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
          “{receipt.statement}”
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ImpactReceiptModal;
