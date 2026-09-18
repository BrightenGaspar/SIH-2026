'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { GlobalHeader } from '@/components/navigation/GlobalHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import {
  Home,
  Truck,
  Navigation,
  RefreshCw,
  ThermometerSnowflake,
  MapPin,
  User,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logisticsUser, isLogisticsAuthenticated, isLoading, logoutLogistics } = useAuth();
  const { t } = useI18n();

  const isPublic =
    pathname === '/logistics' ||
    pathname === '/logistics/login' ||
    pathname === '/logistics/register' ||
    pathname === '/logistics/complete-profile';

  const isGuestAllowed =
    isPublic ||
    pathname.startsWith('/logistics/track');

  useEffect(() => {
    if (!isGuestAllowed && !isLoading) {
      if (!isLogisticsAuthenticated && !logisticsUser && !currentUser) {
        router.push('/logistics/login');
      } else if (
        logisticsUser &&
        logisticsUser.profileCompleted === false &&
        pathname !== '/logistics/complete-profile'
      ) {
        router.push('/logistics/complete-profile');
      }
    }
  }, [isGuestAllowed, isLoading, isLogisticsAuthenticated, logisticsUser, currentUser, pathname, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading Logistics Portal...</p>
      </div>
    );
  }

  if (!isGuestAllowed && !isLogisticsAuthenticated && !logisticsUser && !currentUser) {
    return null;
  }

  const navItems = [
    { href: '/logistics/dashboard', label: 'Fleet Overview', icon: Home },
    { href: '/logistics/trips', label: 'Consolidated Trips', icon: Navigation },
    { href: '/logistics/return-loads', label: 'Return Load AI', icon: RefreshCw },
    { href: '/logistics/telemetry', label: 'Reefer Telemetry', icon: ThermometerSnowflake },
    { href: '/logistics/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. GLOBAL HEADER (Exact reference match) */}
      <GlobalHeader />

      {/* 2. BODY: DESKTOP SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {/* Desktop Sidebar (White + Light Amber, exact reference match) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 py-6 px-4 justify-between">
          <div className="space-y-6">
            <div className="px-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Logistics Fleet</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/logistics/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors',
                      isActive
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-amber-700' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Promo Card (from reference image) */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-center mt-6">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-amber-900">Safe Delivery • Fresh Produce</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Optimized return hauls with verified 6.2°C cold-chain preservation.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav role="logistics" />
    </div>
  );
}
