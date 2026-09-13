'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  TrendingUp,
  Truck,
  User,
  Store,
  ShoppingBag,
  Heart,
  Navigation,
  MapPin,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  role: 'farmer' | 'consumer' | 'logistics';
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const farmerItems = [
    { label: 'Home', href: '/farmer/dashboard', icon: Home },
    { label: 'Market', href: '/farmer/market-prices', icon: TrendingUp },
    { label: 'Orders', href: '/farmer/orders', icon: Truck },
    { label: 'Profile', href: '/farmer/profile', icon: User },
  ];

  const consumerItems = [
    { label: 'Home', href: '/consumer/dashboard', icon: Home },
    { label: 'Market', href: '/consumer/marketplace', icon: Store },
    { label: 'Orders', href: '/consumer/orders', icon: ShoppingBag },
    { label: 'Profile', href: '/consumer/profile', icon: User },
  ];

  const logisticsItems = [
    { label: 'Home', href: '/logistics/dashboard', icon: Home },
    { label: 'Deliveries', href: '/logistics/trips', icon: Navigation },
    { label: 'Map', href: '/logistics/telemetry', icon: MapPin },
    { label: 'Profile', href: '/logistics', icon: User },
  ];

  const items =
    role === 'farmer'
      ? farmerItems
      : role === 'consumer'
      ? consumerItems
      : logisticsItems;

  const activeColor =
    role === 'farmer'
      ? 'text-emerald-600 font-bold'
      : role === 'consumer'
      ? 'text-blue-600 font-bold'
      : 'text-amber-600 font-bold';

  const inactiveColor = 'text-slate-500 hover:text-slate-800 font-medium';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex justify-around items-center shadow-lg"
    >
      {items.map(item => {
        const isActive = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all',
              isActive ? activeColor : inactiveColor
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'scale-110')} />
            <span className="text-[10px] leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
