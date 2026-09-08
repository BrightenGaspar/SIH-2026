'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Store, 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  Users, 
  ChevronRight, 
  Award, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight,
  Snowflake,
  BarChart3
} from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export default function ConsumerLandingPage() {
  const { t } = useI18n();

  const buyerProfiles = [
    {
      title: 'Bulk Commercial Buyers',
      desc: 'Mandis, processors, FMCG, and regional distributors requiring 1 to 50 Ton aggregated road dispatches.',
      badge: 'Up to 50 MT Multi-Farmer',
      color: 'border-emerald-500/30 bg-emerald-500/5'
    },
    {
      title: 'Restaurants & Commercial Kitchens',
      desc: 'Daily crisp harvest deliveries with guaranteed cold-chain temperature control and exact weight receipts.',
      badge: 'Daily Scheduled Road Delivery',
      color: 'border-cyan-500/30 bg-cyan-500/5'
    },
    {
      title: 'Retailers & Supermarkets',
      desc: 'Uniform Grade A produce with computer-vision quality verification and fair farm-gate origin traceability.',
      badge: 'Grade A Guaranteed',
      color: 'border-purple-500/30 bg-purple-500/5'
    },
    {
      title: 'Conscious Households',
      desc: 'Farm-fresh direct vegetables harvested within 24-48 hours. Zero middleman markups.',
      badge: 'Harvested Today',
      color: 'border-amber-500/30 bg-amber-500/5'
    }
  ];

  const valuePillars = [
    {
      icon: ShieldCheck,
      title: 'Direct Farm Quality Assurance',
      desc: 'Quality-tested harvest batches with verified farm provenance, harvest date timestamps, and cold-chain compliance.',
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      icon: Users,
      title: 'Multi-Farmer Consolidation',
      desc: 'Solve smallholder fragmentation. AgriFlow consolidates yields across 3-10 local partner FPOs into one single truck dispatch.',
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      icon: Snowflake,
      title: 'Verified Cold-Chain Road Fleet',
      desc: 'Tata 407 Reefer & Bolero trucks monitored live via IoT telemetry for temperature (2-8°C) and RH preservation.',
      color: 'text-cyan-500 bg-cyan-500/10'
    },
    {
      icon: TrendingUp,
      title: '70%+ Direct Farmer Realization',
      desc: 'Transparent pricing with smart escrow contracts. Eliminate 5 layers of commission agents and middleman wastage.',
      color: 'text-amber-500 bg-amber-500/10'
    }
  ];

  return (
    <div className="space-y-16 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-950 border border-emerald-500/30 p-8 sm:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Direct Farm Procurement
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
            Fresh Produce Directly From <span className="text-emerald-400">Verified Indian Farms</span>.
          </h1>

          <p className="text-sm sm:text-lg text-zinc-300 font-normal leading-relaxed">
            Eliminate commission agents. Buy directly from FPOs and progressive farmers with verified farm quality, cold-chain road transport, and transparent escrow pricing.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/consumer/marketplace"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95"
            >
              <Store className="w-4 h-4" /> Explore Marketplace <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/consumer/register"
              className="px-6 py-3.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm flex items-center gap-2 transition-all duration-200"
            >
              Create Buyer Account
            </Link>

            <Link
              href="/consumer/login"
              className="px-4 py-3.5 text-xs text-zinc-400 hover:text-white font-semibold transition-colors"
            >
              Already registered? Sign In
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">72.4%</span>
            <p className="text-xs text-zinc-400 mt-0.5">Direct Farmer Share</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
            <p className="text-xs text-zinc-400 mt-0.5">Direct Farm Traceability</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">4-8°C</span>
            <p className="text-xs text-zinc-400 mt-0.5">Monitored Cold-Chain</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">0%</span>
            <p className="text-xs text-zinc-400 mt-0.5">Middleman Arbitrage</p>
          </div>
        </div>
      </section>

      {/* Buyer Profiles Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            Tailored For Every Sourcing Need
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Whether you are ordering 5 kg for your home or 5,000 kg for a regional distribution chain, AgriFlow adapts pricing and logistics automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {buyerProfiles.map((profile, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl border ${profile.color} flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow`}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 inline-block mb-3">
                  {profile.badge}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {profile.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  {profile.desc}
                </p>
              </div>

              <Link
                href="/consumer/register"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group"
              >
                Register as {profile.title.split(' ')[0]} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Core Technology Pillars */}
      <section className="p-8 sm:p-12 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            How AgriFlow Eliminates Friction
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            From farm-gate inspection to road transit telemetry, our platform replaces opaque middlemen with transparent technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valuePillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-4"
              >
                <div className={`p-3 rounded-xl ${pillar.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SIH 5,000 kg Live Demo Callout */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900 to-zinc-900 border border-emerald-500/40 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-extrabold text-[11px] uppercase tracking-wider">
            SIH Highlight Demo
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            5,000 kg Hyderabad Tomato Multi-Farmer Fulfillment
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Experience how AgriFlow dynamically aggregates 2,500 kg from Shadnagar Organic FPO, 1,500 kg from Chevella Farmers Collective, and 1,000 kg from K. Mallesh into one consolidated Tata 407 Reefer dispatch.
          </p>
        </div>

        <Link
          href="/consumer/dashboard"
          className="px-6 py-3 rounded-xl bg-white text-zinc-950 hover:bg-emerald-400 font-extrabold text-xs shrink-0 transition-colors shadow-md"
        >
          View Live Demo Order
        </Link>
      </section>
    </div>
  );
}
