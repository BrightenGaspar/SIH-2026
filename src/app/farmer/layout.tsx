'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { GlobalHeader } from '@/components/navigation/GlobalHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import {
  Home,
  Sprout,
  TrendingUp,
  Truck,
  MapPin,
  Sparkles,
  User,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useI18n();

  // Navigation items matching reference design while preserving all existing routes
  const navItems = [
    { label: 'Home', href: '/farmer/dashboard', icon: Home },
    { label: 'My Produce', href: '/farmer/produce', icon: Sprout },
    { label: 'Virtual Cooperative', href: '/farmer/clusters', icon: Users },
    { label: 'Market Prices', href: '/farmer/market-prices', icon: TrendingUp },
    { label: 'Orders', href: '/farmer/orders', icon: ShoppingBag },
    { label: 'Logistics', href: '/farmer/demand-map', icon: Truck },
    { label: 'AI Intelligence', href: '/farmer/intelligence', icon: Sparkles },
    { label: 'Profile', href: '/farmer/profile', icon: User },
  ];

  // Route protection
  const publicFarmerRoutes = ['/farmer', '/farmer/login', '/farmer/register', '/farmer/complete-profile'];
  const isPublicRoute = publicFarmerRoutes.includes(pathname);

  React.useEffect(() => {
    if (!isPublicRoute && !isLoading) {
      if (!isAuthenticated && !user && !currentUser) {
        router.push('/farmer/login');
      } else if (user && user.profileCompleted === false && pathname !== '/farmer/complete-profile') {
        router.push('/farmer/complete-profile');
      }
    }
  }, [isPublicRoute, isLoading, isAuthenticated, user, currentUser, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading Farmer Portal...</p>
      </div>
    );
  }

  if (!isAuthenticated && !user && !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. GLOBAL HEADER (Exact reference match with dual-mode toggle) */}
      <GlobalHeader />

      {/* 2. BODY LAYOUT: DESKTOP SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {/* Desktop Sidebar (White + Light Green, exact reference match) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 py-6 px-4 justify-between">
          <div className="space-y-6">
            {/* Sidebar header */}
            <div className="px-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Farmer Portal</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/farmer/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors',
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-700' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Promo Card (from reference image) */}
          <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 text-center mt-6">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-emerald-900">Grow Together With AgriFlow</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Fair prices, zero middleman markups & verified cold chain.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (Exact reference match) */}
      <MobileBottomNav role="farmer" />
    </div>
  );
}
