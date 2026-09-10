'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  Store, 
  Truck, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CloudRain,
  Search,
  Zap
} from 'lucide-react';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';

export default function PublicGateway() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
      
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/30">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Agri<span className="text-emerald-400">Flow</span> AI
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectionIndicator />
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Gateway Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-5xl mx-auto w-full">
        
        {/* Title & Tagline */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Direct Farm Sourcing &bull; Group Selling &bull; Smart Cold Chain</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Agri<span className="text-emerald-400">Flow</span> AI
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
            One platform for Farmers, Buyers and Logistics Operators. Choose your portal to continue.
          </p>
        </div>

        {/* 3 Separate Portal Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full max-w-4xl">
          
          {/* 1. FARMER PORTAL */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/30 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sprout className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">FARMER</span>
                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  Farmer Portal
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Sell produce directly to verified buyers with fair market pricing and group pooling.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60">
              <Link
                href="/farmer/login"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/30 group-hover:gap-3"
              >
                <span>Continue as Farmer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. BUYER / CONSUMER PORTAL */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-teal-950/30 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Store className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">BUYER</span>
                <h2 className="text-xl font-black text-white group-hover:text-teal-300 transition-colors">
                  Buyer / Consumer Portal
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Source fresh produce directly from farmers with verified provenance and freshness.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60">
              <Link
                href="/consumer/login"
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-900/30 group-hover:gap-3"
              >
                <span>Continue as Buyer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. LOGISTICS OPERATOR PORTAL */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/30 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">LOGISTICS</span>
                <h2 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  Logistics Operator Portal
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Manage road deliveries, reefer telemetry, live tracking and return freight loads.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60">
              <Link
                href="/logistics/login"
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-900/30 group-hover:gap-3"
              >
                <span>Continue as Logistics</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Unified Ecosystem Quick Bar */}
        <div className="mt-8 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-4xl w-full flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Central Intelligence:</span>
          </div>
            <Link href="/farmer/intelligence" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Decision Center</span>
            </Link>
            <span className="text-slate-600">&bull;</span>
            <Link href="/farmer/weather-shock" className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Weather Shock Simulator</span>
            </Link>
            <span className="text-slate-600">&bull;</span>
            <Link href="/traceability/LOT-2026-7842" className="text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Universal Traceability</span>
            </Link>
            <span className="text-slate-600">&bull;</span>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Admin Center</span>
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 AgriFlow AI &bull; Direct Farm-to-Buyer Ecosystem</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Secure Role-Separated Portals</span>
            <span>&bull;</span>
            <span>Low-Bandwidth Optimized</span>
          </div>
        </div>
      </footer>

    </div>
  );
}