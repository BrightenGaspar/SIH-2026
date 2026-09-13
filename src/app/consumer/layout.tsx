'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { GlobalHeader } from '@/components/navigation/GlobalHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import {
  Home,
  Store,
  ShoppingBag,
  Package,
  Truck,
  User,
  Heart,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { consumerUser, isConsumerAuthenticated, logoutConsumer } = useAuth();
  const { totalItems } = useCart();
  const { t } = useI18n();

  const isPublicPage =
    pathname === '/consumer' ||
    pathname === '/consumer/login' ||
    pathname === '/consumer/register' ||
    pathname === '/consumer/complete-profile';

  useEffect(() => {
    if (!isPublicPage && !isConsumerAuthenticated) {
      router.push('/consumer/login');
    } else if (
      isConsumerAuthenticated &&
      consumerUser &&
      consumerUser.profileCompleted === false &&
      pathname !== '/consumer/complete-profile'
    ) {
      router.push('/consumer/complete-profile');
    }
  }, [isPublicPage, isConsumerAuthenticated, consumerUser, pathname, router]);

  // If on login/register/splash public page, render children directly without dashboard sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  const navLinks = [
    { href: '/consumer/dashboard', label: 'Home', icon: Home },
    { href: '/consumer/marketplace', label: 'Marketplace', icon: Store },
    { href: '/consumer/orders', label: 'My Orders', icon: Package },
    { href: '/consumer/cart', label: `Cart (${totalItems})`, icon: ShoppingBag },
    { href: '/consumer/tracking', label: 'Live Tracking', icon: Truck },
    { href: '/consumer/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. GLOBAL HEADER (Exact reference match) */}
      <GlobalHeader />

      {/* 2. BODY: DESKTOP SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        {/* Desktop Sidebar (White + Light Blue, exact reference match) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 py-6 px-4 justify-between">
          <div className="space-y-6">
            <div className="px-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Buyer Marketplace</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navLinks.map(item => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/consumer/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-blue-700' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Promo Card (from reference image) */}
          <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 text-center mt-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-blue-900">Fresh Food • Healthy Life</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              100% farm-traceable produce with cold-chain guarantee.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav role="consumer" />
    </div>
  );
}
