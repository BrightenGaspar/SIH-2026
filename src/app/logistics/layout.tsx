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
  PhoneCall,
  Menu,
  X
} from 'lucide-react';

import { LanguageSelector } from '@/components/common/LanguageSelector';
import { LowBandwidthToggle } from '@/components/common/LowBandwidthToggle';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();
  const { logisticsUser, logoutLogistics } = useAuth();

  const navItems = [
    { href: '/logistics/dashboard', label: t('fleetDashboard') || 'Fleet Dashboard', icon: Layers },
    { href: '/logistics/trips', label: t('consolidatedTrips') || 'Consolidated Trips', icon: Truck },
    { href: '/logistics/return-loads', label: t('returnLoadAI') || 'Return Load AI', icon: RefreshCw },
    { href: '/logistics/telemetry', label: t('reeferTelemetry') || 'Reefer Telemetry', icon: ThermometerSnowflake },
  ];

  const publicRoutes = ['/logistics', '/logistics/login', '/logistics/register', '/logistics/complete-profile'];
  const isPublic = publicRoutes.includes(pathname);

  React.useEffect(() => {
    if (!isPublic && !logisticsUser) {
      // If unauthenticated on protected logistics routes, redirect to login
      window.location.href = '/logistics/login';
    } else if (logisticsUser && logisticsUser.profileCompleted === false && pathname !== '/logistics/complete-profile') {
      window.location.href = '/logistics/complete-profile';
    }
  }, [isPublic, logisticsUser, pathname]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!logisticsUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Universal Top Switcher Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Truck className="w-3.5 h-3.5" /> AgriFlow Fleet & Cold-Chain Network
          </span>
          <span className="hidden md:inline text-slate-500">&bull; Telemetry & Return-Haul Optimization</span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionIndicator />
          <LowBandwidthToggle />
          <Link href="/" className="hover:text-slate-200 transition flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Home Hub
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/farmer" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
            <Sprout className="w-3 h-3" /> Farmer Portal
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/consumer" className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1">
            <Store className="w-3 h-3" /> Buyer Portal
          </Link>
          <span className="text-slate-700">|</span>
          <LanguageSelector variant="compact" />
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-cyan-600/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
                  AgriFlow <span className="text-cyan-400">Logistics</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 whitespace-nowrap">
                  Active Fleet Ops
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">Reefer Telemetry, Highway Routes & Return Load Matching</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/farmer/tracking/TRK-RD-9021"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold transition"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Active Trip GPS</span>
              <span className="sm:hidden">GPS</span>
            </Link>

            {logisticsUser && (
              <button
                onClick={logoutLogistics}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-rose-950/40 hover:border-rose-700/50 text-xs font-semibold text-slate-300 hover:text-rose-400 transition"
              >
                {t('logout')}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
        {children}
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>AgriFlow AI &bull; SIH Smart Cold-Chain Transport & Logistics Platform</p>
      </footer>
    </div>
  );
}
