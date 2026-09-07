'use client';

import React from 'react';
import { ProofOfDelivery } from '@/types/delivery';
import { ShieldCheck, CheckCircle2, QrCode, FileText } from 'lucide-react';

interface ProofOfDeliveryCardProps {
  pod: ProofOfDelivery;
  orderId: string;
  isDelivered: boolean;
}

export default function ProofOfDeliveryCard({
  pod,
  orderId,
  isDelivered,
}: ProofOfDeliveryCardProps) {
  if (!isDelivered && !pod.isVerified) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Digital Proof of Delivery (POD)
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Pending Destination Scan
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Smart Escrow release will automatically execute when the receiving party scans the digital QR barcode and signs the electronic POD weighment bill upon arrival.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Proof of Delivery Verified
        </span>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ESCROW RELEASED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-slate-400 block text-[11px]">Received & Confirmed By</span>
          <strong className="text-white text-sm block">{pod.receivedBy}</strong>
          <span className="text-emerald-400 font-mono text-[11px] block">{pod.timestamp}</span>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 block text-[11px]">Digital Verification Token</span>
          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-900 text-emerald-300 border border-emerald-500/30 inline-block">
            {pod.verificationCode}
          </span>
        </div>
      </div>

      {pod.notes && (
        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
          📝 Notes: {pod.notes}
        </p>
      )}
    </div>
  );
}
