'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  User, 
  Truck, 
  QrCode, 
  Lock, 
  Copy, 
  Check, 
  Clock,
  AlertCircle,
  Hash,
  Download
} from 'lucide-react';
import { getTraceabilityLot } from '@/services/traceabilityService';
import { TraceabilityLot } from '@/types/intelligence';
import { DataStatusBadge } from '@/components/common/DataStatusBadge';
import { cn } from '@/lib/utils';

export default function TraceabilityDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const lotId = resolvedParams.lotId;

  const [lot, setLot] = useState<TraceabilityLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getTraceabilityLot(lotId)
      .then((data) => {
        if (isMounted) setLot(data);
      })
      .catch((err) => {
        console.error('Error loading traceability lot:', err);
        if (isMounted) setLot(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lotId]);

  const qrShareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/traceability/${lotId}`
    : `https://agriflow.ai/traceability/${lotId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrShareUrl)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(qrShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      
      {/* Top Header */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2.5 px-4 sm:px-8 flex items-center justify-between border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">AgriFlow Cryptographic Verification Certificate</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/consumer/marketplace" className="hover:text-white">
            Marketplace
          </Link>
          <Link href="/farmer/produce" className="hover:text-white font-bold text-emerald-300">
            Farmer Portal &rarr;
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/consumer/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <DataStatusBadge
            status={lot ? 'LIVE' : 'NO_DATA'}
            source="Supabase Production Ledger"
            showSource={true}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading verified traceability ledger...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving tamper-evident event history for {lotId}</p>
          </div>
        )}

        {/* Honest Empty State: Lot Not Found */}
        {!loading && !lot && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              No Verified Traceability Events Available
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
              Lot identifier <strong className="text-slate-700 dark:text-slate-300">{lotId}</strong> has not yet been registered or audited in the production registry.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/consumer/marketplace"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Browse Marketplace Produce
              </Link>
              <Link
                href="/farmer/produce"
                className="border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                List Produce as Farmer
              </Link>
            </div>
          </div>
        )}

        {/* Real Verified Lot Display */}
        {!loading && lot && (
          <div className="space-y-6">
            
            {/* Top Overview Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Production Lot
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {lot.commodity}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Variety: <strong>{lot.variety}</strong> • Lot ID: <span className="font-mono">{lot.lotId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>View QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Share Certificate'}</span>
                  </button>
                </div>
              </div>

              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Farmer Origin</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {lot.farmerName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Farm Gate Hub</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {lot.farmLocation}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Harvest Quantity</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 block">
                    {lot.initialQuantityKg.toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Verified Grade</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {lot.assignedGrade}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle Stages & Cryptographic Audit Trail */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Lifecycle Audit Trail
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each completed event is cryptographically sealed with a SHA-256 integrity hash.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> SHA-256 Ledger
                </div>
              </div>

              {/* Event Step Timeline */}
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3.5 space-y-6">
                {lot.steps.map((step) => {
                  const isCompleted = step.status === 'COMPLETED';
                  const isPending = step.status === 'PENDING';

                  return (
                    <div key={step.stepNumber} className="relative pl-6">
                      {/* Step Indicator Dot */}
                      <span
                        className={cn(
                          'absolute -left-[9px] top-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                        )}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-2.5 h-2.5" />}
                      </span>

                      {/* Step Content */}
                      <div
                        className={cn(
                          'p-4 rounded-xl border transition-all',
                          isCompleted
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-50/20 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {step.phase}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              )}
                            >
                              {step.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {step.timestamp}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Location: {step.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Actor: {step.actor}</span>
                          </div>
                        </div>

                        {/* Honest Cryptographic Verification Hash */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Hash className="w-3 h-3 text-emerald-500" /> Cryptographic Verification Hash
                            </span>
                            <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              {step.verifiedHash}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && lot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                Verified Lot QR Code
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Scan with any smartphone camera to view verified origin, harvest, and cold-chain credentials.
              </p>

              <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mx-auto mb-4 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${lot.lotId}`}
                  className="w-56 h-56 mx-auto"
                />
              </div>

              <p className="text-[11px] font-mono text-slate-500 break-all mb-5">
                {qrShareUrl}
              </p>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
