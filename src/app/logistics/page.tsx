'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { sharedTrackingService } from '@/services/sharedTrackingService';
import { DeliveryTracking } from '@/types/delivery';
import { DriverDispatchModal } from '@/components/logistics/DriverDispatchModal';
import {
  Truck,
  MapPin,
  ThermometerSnowflake,
  ArrowRight,
  Activity,
  AlertTriangle,
  Radio,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Navigation,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function LogisticsLandingPage() {
  const { isLogisticsAuthenticated } = useAuth();
  const [trips, setTrips] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sharedTrackingService.getAllTrips()
      .then((data) => setTrips(data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const logisticsPillars = [
    {
      icon: ThermometerSnowflake,
      title: 'Weather-Synced GPS Fleet Tracking',
      desc: 'Real-time GPS route monitoring combined with Open-Meteo meteorological weather synchronization to protect perishable harvest freshness.',
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: RotateCcw,
      title: 'Return Load Matching AI',
      desc: 'Eliminate deadhead miles on return legs with automated backhaul cargo matching (fertilizer, empty harvest crates).',
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Radio,
      title: 'Phone GPS Beacon',
      desc: 'Turn any driver smartphone into an encrypted telematics beacon with wake-lock support and SMS offline fallback.',
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Guaranteed Transporter Escrow',
      desc: 'Transparent per-kilometer freight pricing with instant UPI bank payouts automatically disbursed upon verified delivery OTP.',
      color: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Driver Dispatch Modal for incoming orders */}
      <DriverDispatchModal onTripAccepted={() => {}} />

      {/* Top Eco Gateway Bar */}
      <div className="bg-white border-b border-slate-200 text-xs py-2 px-4 flex items-center justify-between text-slate-500">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1 font-semibold transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Main AgriFlow Ecosystem Gateway
        </Link>
        <span className="text-amber-700 font-bold">Logistics & Cold-Chain Fleet Network</span>
      </div>

      {/* Public Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black shadow-xs">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                AgriFlow<span className="text-amber-600"> Logistics</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Cold-Chain Fleet Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLogisticsAuthenticated ? (
              <Link href="/logistics/dashboard">
                <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shadow-xs font-bold">
                  Go to Fleet Dashboard &rarr;
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/logistics/login">
                  <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100 font-semibold">
                    Operator Login
                  </Button>
                </Link>
                <Link href="/logistics/register">
                  <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shadow-xs font-bold">
                    Register Vehicle Fleet
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Perishable Road Freight & Reefer Command Center
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mb-6">
          Smarter farm routes, zero deadhead miles, and{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
            guaranteed cold-chain freshness
          </span>
          .
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          AgriFlow connects truck operators, local pickups, and regional wholesale mandis. Reduce empty return runs, earn up to ₹4,500 extra per corridor, and ensure 100% farm-traceable produce delivery.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {isLogisticsAuthenticated ? (
            <Link href="/logistics/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base px-8 py-4 shadow-sm bg-amber-600 hover:bg-amber-500 text-white font-bold">
                <span>Access Operator Dashboard</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/logistics/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base px-8 py-4 shadow-sm bg-amber-600 hover:bg-amber-500 text-white font-bold">
                  <span>Register Vehicle Fleet</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/logistics/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base px-8 py-4 border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-extrabold shadow-sm">
                  <span>Operator Login</span>
                </Button>
              </Link>
            </>
          )}

          <Link href="/logistics/telemetry" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full text-base px-6 py-4 border-amber-300 text-amber-800 hover:bg-amber-50 font-bold">
              <Activity className="w-4 h-4 mr-2 text-amber-600" />
              <span>Live Telemetry Console</span>
            </Button>
          </Link>
        </div>

        {/* Live Network KPI Strip */}
        <div className="mt-14 w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">4-8°C</span>
            <p className="text-xs text-slate-500 mt-0.5">Cold Chain Setpoint</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">+₹2,800</span>
            <p className="text-xs text-slate-500 mt-0.5">Avg Return Load Gain</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600">68 km</span>
            <p className="text-xs text-slate-500 mt-0.5">Empty Miles Avoided</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-blue-600">100%</span>
            <p className="text-xs text-slate-500 mt-0.5">Highway GPS Coverage</p>
          </div>
        </div>
      </section>

      {/* 4 Technology Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Built for Real Indian Highways & Mandis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            High performance, low bandwidth optimization, phone-based tracking, and instant escrow settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {logisticsPillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all">
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Dispatches Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Dispatch Stream
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Regional Highway Trips & Telemetry
              </h2>
            </div>

            <Link href="/logistics/trips">
              <Button size="sm" variant="secondary" className="border border-slate-200 text-xs font-bold">
                View All Trips ({trips.length}) &rarr;
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading live highway routes...
            </div>
          ) : trips.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No trips currently active. Incoming farmer-to-consumer orders will appear here for driver acceptance.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.slice(0, 4).map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{t.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold mt-1">
                      {t.produceName} ({t.totalQuantityKg} kg) &bull; {t.pickupLocation} &rarr; {t.destinationLocation}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Carrier: {t.vehicleNumber} ({t.vehicleType})
                    </p>
                  </div>

                  <Link href={`/consumer/tracking/${t.id}`}>
                    <Button size="sm" variant="secondary" className="shrink-0 text-xs font-bold bg-white hover:bg-slate-100 shadow-2xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 mr-1" /> Map
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-slate-900 text-white py-14 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Run Efficient Perishable Road Freight?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Register your vehicle, start receiving daily cluster pickups, and optimize your revenue with AI return loads.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/logistics/register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 shadow-md">
                Register as Transporter
              </Button>
            </Link>
            <Link href="/logistics/login">
              <Button size="lg" className="bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-600 font-extrabold px-8 shadow-md">
                Operator Login
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
