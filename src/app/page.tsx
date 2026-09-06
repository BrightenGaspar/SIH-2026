'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Tractor, ShoppingCart, Truck, ShieldCheck, TrendingUp, Sparkles, Network } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Notification Bar */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-xs py-2 px-4 text-center text-emerald-300 font-medium">
        ✨ Smart India Hackathon Demo Ready: <span className="text-white font-semibold">AgriFlow AI Demand & Perishable Value Chain Network</span>
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
              🌾
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">AgriFlow<span className="text-emerald-400">AI</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Ecosystem Gateway</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/farmer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md shadow-emerald-900/20"
            >
              <Tractor className="w-4 h-4" />
              <span>Enter Farmer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Direct Demand Discovery • Zero Intermediary Waste • Perishable Cold Logistics
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Empowering India&apos;s Agricultural Supply Chain with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Intelligent AI</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose your dedicated platform below. AgriFlow AI connects farmers, bulk buyers, and road freight operators with AI quality grading, price forecasting, and consolidated logistics.
          </p>
        </div>

        {/* 3 Main Portals Gateway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* 1. Farmer Portal Card (Active) */}
          <div className="relative group rounded-2xl bg-gradient-to-b from-emerald-900/40 via-slate-900 to-slate-900 border-2 border-emerald-500/60 p-8 flex flex-col justify-between transition-all duration-300 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-900/40 hover:-translate-y-1">
            <div className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Active Portal
            </div>

            <div>
              <div className="w-14 h-14 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Tractor className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Farmer / FPO Portal</h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                List produce, AI computer-vision grade inspection, mandi price comparison, produce pooling, best time to sell forecasts, and road logistics tracking.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>AI Produce Quality Grading (A, A-, B, etc.)</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Mandi Price Arbitrage & Demand Heatmaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Multi-Farmer Group Produce Pooling</span>
                </li>
              </ul>
            </div>

            <Link
              href="/farmer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-900/40"
            >
              <span>Enter Farmer Experience</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* 2. Consumer / Bulk Buyer Portal (Separate Gateway Item) */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 mb-6">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Bulk Buyer / Consumer</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Separate Portal</span>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Procure Grade-A fresh produce direct from verified farm gates with traceable digital batch provenance.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Direct Farm Gate B2B Procurement</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Live Cold-Chain Telemetry Auditing</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full cursor-not-allowed bg-slate-800 text-slate-500 font-semibold py-3 px-4 rounded-xl text-center text-sm border border-slate-700"
            >
              Consumer Portal (Standalone App)
            </button>
          </div>

          {/* 3. Logistics Operator Portal (Separate Gateway Item) */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all duration-300">
            <div>
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mb-6">
                <Truck className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Logistics Operator</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Separate Portal</span>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Fleet management for Tata Ace, Tata 407 Reefer & Mahindra Bolero road freight carriers with return-load matching.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Route Multi-Stop Consolidation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Empty Return Mileage Optimization</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full cursor-not-allowed bg-slate-800 text-slate-500 font-semibold py-3 px-4 rounded-xl text-center text-sm border border-slate-700"
            >
              Logistics Portal (Standalone App)
            </button>
          </div>

        </div>

        {/* SIH Scenario Highlight Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
              💡
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SIH Demo Live Case Study: Hyderabad Tomato Supply Gap</h3>
              <p className="text-xs text-slate-300">Tomato demand in Hyderabad is 5,000 kg with an 1,800 kg gap. Realization improves by <strong className="text-emerald-400">+₹6.00/kg (+16.7%)</strong> with produce pooling & road freight savings.</p>
            </div>
          </div>
          <Link
            href="/farmer"
            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition"
          >
            Launch Farmer Experience →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-400">
        <p>© 2026 AgriFlow AI Ecosystem. Built for Smart India Hackathon. Dedicated Farmer Platform.</p>
      </footer>
    </div>
  );
}


