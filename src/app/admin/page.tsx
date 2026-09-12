'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Truck, 
  CloudRain, 
  TrendingUp, 
  AlertOctagon, 
  Activity, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  Sprout
} from 'lucide-react';

export default function AdminCommandCenterPage() {
  const portalLinks = [
    {
      title: 'Farmer & FPO Decision Center',
      description: 'Unified AI pricing, weather shock simulator, buyer ranking & storage optimizer',
      href: '/farmer/intelligence',
      badge: 'Dynamic AI Core',
      icon: Sprout,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Consumer & Buyer Marketplace',
      description: 'Wholesale direct produce sourcing, verified QC grades & transparent checkout',
      href: '/consumer/marketplace',
      badge: 'Buyer Network',
      icon: Building2,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Road Logistics & Reefer Telemetry',
      description: 'Live GPS route optimization, IoT temperature sensors & zero-internet SMS fallback',
      href: '/logistics',
      badge: 'Cold Chain',
      icon: Truck,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Universal Lot Traceability Audit',
      description: '10-step cryptographic provenance from seed sowing to instant bank UPI payout',
      href: '/traceability/LOT-2026-7842',
      badge: 'Verified Ledger',
      icon: ShieldCheck,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8 font-sans'>
      
      {/* Top Header */}
      <div className='max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg'>
            <ShieldCheck className='w-6 h-6' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <span className='text-[11px] font-extrabold uppercase tracking-widest text-emerald-400'>
                AgriFlow AI Platform Architecture
              </span>
              <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
            </div>
            <h1 className='text-2xl sm:text-3xl font-black text-white tracking-tight'>
              Admin Command & Coordination Center
            </h1>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Link
            href='/'
            className='px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700'
          >
            Public Gateway
          </Link>
          <Link
            href='/farmer/intelligence'
            className='px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md'
          >
            <Sparkles className='w-4 h-4' /> Launch Farmer AI
          </Link>
        </div>
      </div>

      <div className='max-w-7xl mx-auto space-y-8'>
        
        {/* Platform Overview Metric Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Active Farmers</span>
            <span className='text-xl font-black text-white block'>1,284</span>
            <span className='text-[10px] text-emerald-400 font-semibold'>+12% this month</span>
          </div>

          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Verified Buyers</span>
            <span className='text-xl font-black text-white block'>342</span>
            <span className='text-[10px] text-blue-400 font-semibold'>Direct retail & FPOs</span>
          </div>

          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Active Reefer Fleet</span>
            <span className='text-xl font-black text-white block'>86</span>
            <span className='text-[10px] text-amber-400 font-semibold'>100% IoT Telemetry</span>
          </div>

          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Daily Volume</span>
            <span className='text-xl font-black text-white block'>48.5 <span className='text-xs text-slate-400'>Tons</span></span>
            <span className='text-[10px] text-slate-400 font-semibold'>Direct trade</span>
          </div>

          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Food Loss Salvaged</span>
            <span className='text-xl font-black text-emerald-400 block'>12,400 <span className='text-xs text-slate-400'>kg</span></span>
            <span className='text-[10px] text-emerald-400 font-semibold'>Via 5 rescue paths</span>
          </div>

          <div className='bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1'>
            <span className='text-[10px] uppercase font-bold text-slate-400 block'>Avg. Farmer Uplift</span>
            <span className='text-xl font-black text-emerald-400 block'>+18.4%</span>
            <span className='text-[10px] text-slate-400 font-semibold'>Over mandi spot</span>
          </div>
        </div>

        {/* Portal Quick Launcher Grid */}
        <div className='space-y-3'>
          <h2 className='text-base font-extrabold uppercase tracking-wider text-slate-400'>
            Unified Platform Architecture Gateways
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {portalLinks.map((portal, idx) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={idx}
                  href={portal.href}
                  className='bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition flex items-start justify-between gap-4 group'
                >
                  <div className='flex items-start gap-3.5'>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${portal.color}`}>
                      <Icon className='w-5 h-5' />
                    </div>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='text-base font-bold text-white group-hover:text-emerald-400 transition'>
                          {portal.title}
                        </h3>
                        <span className='text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300'>
                          {portal.badge}
                        </span>
                      </div>
                      <p className='text-xs text-slate-400 leading-relaxed'>
                        {portal.description}
                      </p>
                    </div>
                  </div>

                  <div className='p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition shrink-0'>
                    <ArrowRight className='w-4 h-4' />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Regional Weather Shock Watch */}
        <div className='bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center'>
                <CloudRain className='w-4 h-4' />
              </div>
              <div>
                <h3 className='text-base font-bold text-white'>
                  Live Weather Shock & Shortage Surveillance
                </h3>
                <p className='text-xs text-slate-400'>
                  Oracle feeds automatically tuning price elasticity across production clusters
                </p>
              </div>
            </div>
            <span className='text-xs text-slate-500'>Updated 8 mins ago</span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'>
            <div className='p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-white text-sm'>Sangareddy & Medak Cluster (Telangana)</span>
                <span className='px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]'>
                  38% Supply Shortage
                </span>
              </div>
              <p className='text-slate-400'>
                Heavy unseasonal rain damaged 40% tomato harvest. Pricing elasticity (0.65) active: benchmark lifted to ₹52.92/kg.
              </p>
              <div className='flex items-center justify-between text-[11px] pt-1 border-t border-slate-700 text-slate-400'>
                <span>Affected Crops: Tomato, Green Chilli</span>
                <Link href='/farmer/weather-shock' className='text-emerald-400 hover:underline font-bold'>
                  Inspect Model &rarr;
                </Link>
              </div>
            </div>

            <div className='p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-white text-sm'>Nashik Agro Belt (Maharashtra)</span>
                <span className='px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]'>
                  22% Supply Shortage
                </span>
              </div>
              <p className='text-slate-400'>
                Hail event impacted rabi onion drying yards. Price elasticity (0.50) dynamically adjusted upward.
              </p>
              <div className='flex items-center justify-between text-[11px] pt-1 border-t border-slate-700 text-slate-400'>
                <span>Affected Crops: Onion (Nashik Red)</span>
                <Link href='/farmer/intelligence' className='text-emerald-400 hover:underline font-bold'>
                  Inspect Model &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
