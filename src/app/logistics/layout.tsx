'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  ThermometerSnowflake, 
  RefreshCw, 
  ShieldCheck, 
  Sprout, 
  Store, 
  ArrowLeft,
  Package,
  Layers,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Universal Top Switcher Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Truck className="w-3.5 h-3.5" /> AgriFlow Fleet & Cold-Chain Network
          </span>
          <span className="hidden md:inline text-slate-500">• Telemetry & Return-Haul Optimization</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-slate-200 transition flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Home Hub
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/farmer/dashboard" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
            <Sprout className="w-3 h-3" /> Farmer Portal
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/consumer/marketplace" className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1">
            <Store className="w-3 h-3" /> Buyer Portal
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-600/30">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  AgriFlow <span className="text-cyan-400">Logistics</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Active Fleet Ops
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Reefer Telemetry, Highway Routes & Return Load Matching</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/farmer/tracking/TRK-RD-9021"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold transition"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Trip GPS</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <span>Main Hub</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>AgriFlow AI • SIH Smart Cold-Chain Transport & Logistics Platform</p>
      </footer>
    </div>
  );
}
