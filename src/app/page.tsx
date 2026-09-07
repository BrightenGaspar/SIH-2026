'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Store, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
              🛒
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">AgriFlow <span className="text-emerald-400">Buyer</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Marketplace & Procurement</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/consumer/marketplace"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md shadow-emerald-900/20"
            >
              <Store className="w-4 h-4" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Direct Farmer Sourcing • Bulk Procurement • Cold Chain Tracking
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            Direct Farm Sourcing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Commercial & Household Buyers</span>
          </h1>
          <p className="text-base text-slate-300 max-w-2xl mx-auto mb-8">
            Access transparent quality-graded produce directly from farmer collectives and verified FPOs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/consumer/marketplace"
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center gap-2 shadow-xl shadow-emerald-950/50"
            >
              <Store className="w-5 h-5" />
              <span>Open Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/consumer/dashboard"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>Buyer Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}