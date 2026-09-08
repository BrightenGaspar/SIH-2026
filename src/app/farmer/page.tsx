'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import {
  Tractor,
  TrendingUp,
  Sparkles,
  Users,
  Truck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function FarmerPublicLandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Back to Gateway */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 flex items-center justify-between text-slate-400">
        <Link href="/" className="hover:text-emerald-400 flex items-center gap-1 font-semibold transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Main AgriFlow Ecosystem Gateway
        </Link>
        <span className="text-emerald-400 font-bold">Farmer / FPO Dedicated Application</span>
      </div>

      {/* Public Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
              🌾
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">AgriFlow<span className="text-emerald-400"> Farmer</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">Direct Demand & AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/farmer/dashboard">
                <Button variant="primary" size="sm">
                  Go to Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/farmer/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/farmer/register">
                  <Button variant="primary" size="sm">
                    Create Farmer Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> For Individual Farmers, FPOs, and Regional Farmer Groups
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mb-6">
          Sell smarter with real demand, better market intelligence, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">transparent pricing</span>.
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          AgriFlow AI helps farmers and FPOs discover demand, compare mandi prices, combine supply with neighboring growers, and coordinate reliable road logistics.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/farmer/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base px-8 py-4 shadow-xl shadow-emerald-900/40">
              <span>Register Farmer / FPO</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/farmer/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full text-base px-8 py-4">
              <span>Farmer Login</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* 6 Key Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Designed for Real Farmers, Not Software Engineers</h2>
          <p className="text-xs sm:text-sm text-slate-400">High contrast, clear pricing, mobile-first responsiveness, and low cognitive load.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Discover Real Market Demand</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find verified bulk buyers, institutional kitchens, and retail consortiums before harvesting, eliminating unsold produce waste.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Direct Produce Listing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Declare harvest quantities, target realization rates, and location hubs to instantly connect with verified wholesale buyers.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Best Time to Sell Forecasts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent multi-factor AI price prediction guides whether to sell immediately or hold produce for impending regional supply deficits.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">4. Group Selling / Produce Pooling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pool smaller harvest batches with neighboring growers to meet 5-ton institutional buyer orders and share road freight costs.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">5. Road Logistics Coordination</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct dispatch with Tata Ace, Tata 407 Reefer & Mahindra Bolero carriers with real-time waypoint progression and cold-chain temperature auditing.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">6. Transparent Realization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero hidden commission deductions. View exact breakdowns: buyer procurement price, road freight, and net farmer bank payouts.
            </p>
          </div>

        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-600/40 rounded-3xl p-8 sm:p-12">
          <h2 className="text-3xl font-black text-white mb-3">Ready to improve your harvest earnings?</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6">Create your farmer account in 2 minutes and start listing your crops.</p>
          <Link href="/farmer/register">
            <Button size="lg" className="px-8 py-3.5 shadow-lg shadow-emerald-900/50">
              Get Started Now →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
