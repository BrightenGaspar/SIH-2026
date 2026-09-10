'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, QrCode, ArrowRight, Search, CheckCircle2, Lock } from 'lucide-react';

export default function TraceabilityLookupPage() {
  const router = useRouter();
  const [lotInput, setLotInput] = useState('LOT-2026-7842');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (lotInput.trim()) {
      router.push(/traceability/);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans'>
      
      {/* Top Bar */}
      <div className='bg-emerald-900 text-emerald-100 text-xs py-2 px-4 flex items-center justify-between'>
        <span className='font-bold flex items-center gap-1.5'>
          <ShieldCheck className='w-4 h-4 text-emerald-400' />
          AgriFlow Universal Provenance & Cold-Chain Ledger
        </span>
        <Link href='/' className='hover:text-white font-bold text-xs'>
          Back to Gateway &rarr;
        </Link>
      </div>

      <main className='flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center items-center space-y-8 text-center'>
        <div className='w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg'>
          <QrCode className='w-8 h-8' />
        </div>

        <div className='space-y-2'>
          <h1 className='text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
            Verify Produce Provenance
          </h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto'>
            Enter a Batch / Lot ID to audit complete 10-step cryptographic provenance from farm soil to cold-chain delivery and farmer payout.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className='w-full max-w-md flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              value={lotInput}
              onChange={(e) => setLotInput(e.target.value)}
              placeholder='e.g. LOT-2026-7842'
              className='w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
            />
          </div>
          <button
            type='submit'
            className='px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5 shrink-0'
          >
            Verify <ArrowRight className='w-4 h-4' />
          </button>
        </form>

        {/* Demo Callout */}
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-w-md w-full text-left space-y-2 text-xs'>
          <div className='flex items-center justify-between'>
            <span className='font-bold text-slate-700 dark:text-slate-300'>Featured Verified Batch:</span>
            <span className='px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]'>
              10/10 Steps Completed
            </span>
          </div>
          <div className='flex items-center justify-between text-slate-500'>
            <span>Batch: <strong className='text-slate-800 dark:text-slate-200'>LOT-2026-7842</strong></span>
            <span>Tomato (Hybrid Desi) &bull; 600 kg</span>
          </div>
          <Link
            href='/traceability/LOT-2026-7842'
            className='block text-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold transition'
          >
            View Full Lifecycle Audit Report &rarr;
          </Link>
        </div>

        <div className='flex items-center gap-6 text-xs text-slate-400'>
          <span className='flex items-center gap-1.5'><Lock className='w-3.5 h-3.5 text-emerald-500' /> SHA-256 Verified Hashes</span>
          <span className='flex items-center gap-1.5'><CheckCircle2 className='w-3.5 h-3.5 text-emerald-500' /> IoT Reefer Telemetry Pass</span>
        </div>
      </main>
    </div>
  );
}
