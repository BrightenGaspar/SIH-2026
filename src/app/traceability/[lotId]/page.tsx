'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  User, 
  Sparkles, 
  Truck, 
  DollarSign, 
  QrCode,
  Lock,
  ExternalLink
} from 'lucide-react';
import { getTraceabilityLot } from '@/services/traceabilityService';
import { cn } from '@/lib/utils';

export default function TraceabilityDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const lotId = resolvedParams.lotId || 'LOT-2026-7842';
  const lot = getTraceabilityLot(lotId);

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16'>
      
      {/* Top Header */}
      <div className='bg-emerald-900 text-emerald-100 text-xs py-2.5 px-4 sm:px-8 flex items-center justify-between border-b border-emerald-800'>
        <div className='flex items-center gap-2'>
          <ShieldCheck className='w-4 h-4 text-emerald-400' />
          <span className='font-bold'>AgriFlow Verified Traceability Certificate</span>
        </div>
        <div className='flex items-center gap-3'>
          <Link href='/traceability' className='hover:text-white'>
            Audit Another Batch
          </Link>
          <Link href='/farmer/intelligence' className='hover:text-white font-bold text-emerald-300'>
            Farmer Portal &rarr;
          </Link>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8'>
        
        {/* Back link */}
        <Link
          href='/traceability'
          className='inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition'
        >
          <ArrowLeft className='w-3.5 h-3.5' /> Back to Traceability Search
        </Link>

        {/* Certificate Hero Card */}
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs'>
                  {lot.currentStatus}
                </span>
                <span className='text-xs font-mono text-slate-400'>Batch: {lot.lotId}</span>
              </div>
              <h1 className='text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1'>
                {lot.commodity} <span className='text-emerald-600 dark:text-emerald-400 font-normal'>({lot.variety})</span>
              </h1>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5'>
                <MapPin className='w-3.5 h-3.5 text-emerald-500' /> {lot.farmLocation} &bull; Harvested: {lot.harvestDate}
              </p>
            </div>

            {/* QR Code */}
            <div className='flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 self-start sm:self-auto'>
              <img
                src={lot.qrCodeDataUrl}
                alt='Batch QR Code'
                className='w-16 h-16 rounded-lg bg-white p-1'
              />
              <div className='text-left text-xs'>
                <span className='font-bold block text-slate-800 dark:text-slate-200'>Cryptographic QR</span>
                <span className='text-[10px] text-slate-400 block'>Scan on mobile to verify</span>
                <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5'>✓ 10 Steps Verified</span>
              </div>
            </div>
          </div>

          {/* Key Parameters */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
            <div className='p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Farmer</span>
              <span className='font-extrabold text-slate-900 dark:text-white text-sm block mt-0.5'>{lot.farmerName}</span>
              <span className='text-[10px] text-slate-400'>Zaheerabad Cluster</span>
            </div>

            <div className='p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Quality Grade</span>
              <span className='font-extrabold text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5'>{lot.assignedGrade}</span>
              <span className='text-[10px] text-slate-400'>AI CV Optically Rated</span>
            </div>

            <div className='p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Marketable Volume</span>
              <span className='font-extrabold text-slate-900 dark:text-white text-sm block mt-0.5'>{lot.marketableQuantityKg} kg</span>
              <span className='text-[10px] text-slate-400'>400 kg damaged salvaged</span>
            </div>

            <div className='p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800'>
              <span className='text-[10px] text-slate-400 uppercase font-semibold block'>Direct Buyer</span>
              <span className='font-extrabold text-slate-900 dark:text-white text-sm block mt-0.5'>{lot.buyerName}</span>
              <span className='text-[10px] text-emerald-600 font-bold'>₹{lot.finalPayoutPerKg}/kg Settled</span>
            </div>
          </div>
        </div>

        {/* 10-Step Timeline */}
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6'>
          <div>
            <h3 className='text-lg font-black text-slate-900 dark:text-white flex items-center gap-2'>
              <ShieldCheck className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
              Complete 10-Step Provenance Lifecycle
            </h3>
            <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
              Immutable timestamped audit trail from seed germination to final farmer bank payout
            </p>
          </div>

          <div className='relative pl-6 sm:pl-8 border-l-2 border-emerald-500/30 space-y-8'>
            {lot.steps.map((step) => (
              <div key={step.stepNumber} className='relative group'>
                {/* Node icon */}
                <div className='absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md'>
                  {step.stepNumber}
                </div>

                <div className='bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1'>
                    <div>
                      <span className='text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block'>
                        Phase {step.stepNumber}
                      </span>
                      <h4 className='text-sm sm:text-base font-extrabold text-slate-900 dark:text-white'>
                        {step.phase}
                      </h4>
                    </div>
                    <span className='text-xs font-mono text-slate-400'>
                      {step.timestamp}
                    </span>
                  </div>

                  <div className='flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400'>
                    <span><strong>Actor:</strong> {step.actor}</span>
                    <span>&bull;</span>
                    <span><strong>Location:</strong> {step.location}</span>
                  </div>

                  {/* Step metadata details */}
                  <div className='bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {Object.entries(step.details).map(([key, val]) => (
                      <div key={key}>
                        <span className='text-[10px] uppercase text-slate-400 font-semibold block'>{key}</span>
                        <span className='font-bold text-slate-800 dark:text-slate-200'>{String(val)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hash */}
                  <div className='flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1'>
                    <Lock className='w-3 h-3 text-emerald-500' />
                    <span>Cryptographic Verification Hash: <strong>{step.verifiedHash}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
