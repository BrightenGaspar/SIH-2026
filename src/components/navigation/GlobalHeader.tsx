'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBandwidth } from '@/context/BandwidthContext';
import {
  Sprout,
  Radio,
  Wifi,
  WifiOff,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Store,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isLowBandwidth, setLowBandwidth } = useBandwidth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Determine current role based on pathname
  const isFarmer = pathname.startsWith('/farmer');
  const isConsumer = pathname.startsWith('/consumer');
  const isLogistics = pathname.startsWith('/logistics');

  // Role theme colors
  const roleColor = isFarmer
    ? 'emerald'
    : isConsumer
    ? 'blue'
    : isLogistics
    ? 'amber'
    : 'emerald';

  const roleLabel = isFarmer
    ? 'Farmer / FPO'
    : isConsumer
    ? 'Consumer / Buyer'
    : isLogistics
    ? 'Logistics Operator'
    : 'AgriFlow Member';

  const displayName =
    (user?.name || (isFarmer ? 'Ramesh Kumar' : isConsumer ? 'Sneha Patel' : 'Vikram Singh'))
      .replace(/[\uD800-\uDFFF]|[\u2600-\u27BF]|\u00f0[^\s]*|\u00e2[^\s]*/g, '')
      .trim() || 'User';

  const avatarInitials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AF';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16 px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* 1. BRAND & SLOGAN */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={isFarmer ? '/farmer/dashboard' : isConsumer ? '/consumer/dashboard' : isLogistics ? '/logistics/dashboard' : '/'}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">AgriFlow</span>
            </div>
            <p className="hidden md:block text-[11px] font-medium text-slate-500 leading-none">
              Better Farming • Better Food • Brighter Future
            </p>
          </div>
        </Link>
      </div>

      {/* 2. DUAL-MODE PILL TOGGLE (Exact reference match) */}
      <div className="flex items-center">
        <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center shadow-xs">
          <button
            type="button"
            onClick={() => setLowBandwidth(false)}
            className={cn(
              'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              !isLowBandwidth
                ? isFarmer
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isConsumer
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            )}
            title="Switch to Normal Mode (Full visuals, images & interactive maps)"
          >
            <span>Normal Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setLowBandwidth(true)}
            className={cn(
              'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              isLowBandwidth
                ? isFarmer
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isConsumer
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            )}
            title="Switch to Low Bandwidth Mode (Text-first, no auto-loaded maps or heavy images)"
          >
            <Radio className={cn('w-3.5 h-3.5', isLowBandwidth && 'animate-pulse')} />
            <span>Low Bandwidth Mode</span>
          </button>
        </div>
      </div>

      {/* 3. RIGHT CONTROLS: NETWORK, NOTIFICATIONS & PROFILE CHIP */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Network Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Online</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* User Profile Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs',
                isFarmer
                  ? 'bg-emerald-600'
                  : isConsumer
                  ? 'bg-blue-600'
                  : 'bg-amber-600'
              )}
            >
              {avatarInitials}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900">{displayName}</p>
              <p className="text-[10px] text-slate-500 font-medium">{roleLabel}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{displayName}</p>
                <p className="text-[11px] text-slate-500">{user?.phone || user?.email || roleLabel}</p>
              </div>

              <div className="py-1">
                <Link
                  href={isFarmer ? '/farmer/profile' : isConsumer ? '/consumer/profile' : '/logistics'}
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Portal
                </div>

                <Link
                  href="/farmer/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 font-medium"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Farmer Portal</span>
                </Link>

                <Link
                  href="/consumer/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs text-blue-700 hover:bg-blue-50 font-medium"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Buyer Marketplace</span>
                </Link>

                <Link
                  href="/logistics/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs text-amber-700 hover:bg-amber-50 font-medium"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Logistics Fleet</span>
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs text-purple-700 hover:bg-purple-50 font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                    router.push('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
