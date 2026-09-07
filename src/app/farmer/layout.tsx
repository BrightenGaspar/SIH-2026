'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { LowBandwidthToggle } from '@/components/common/LowBandwidthToggle';
import {
  LayoutDashboard,
  Sprout,
  TrendingUp,
  MapPin,
  Sparkles,
  Truck,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Languages,
  ChevronDown,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Exact required authenticated navigation labels:
  // Dashboard | My Produce | Mandi Prices | Demand Map | AI Recommendations | Orders & Delivery
  const navItems = [
    { label: t('dashboard'), href: '/farmer/dashboard', icon: LayoutDashboard },
    { label: t('myProduce'), href: '/farmer/produce', icon: Sprout },
    { label: t('mandiPrices'), href: '/farmer/market-prices', icon: TrendingUp },
    { label: t('demandMap'), href: '/farmer/demand-map', icon: MapPin },
    { label: t('aiRecommendations'), href: '/farmer/recommendations', icon: Sparkles },
    { label: t('ordersAndDelivery'), href: '/farmer/orders', icon: Truck },
  ];

  // Route protection
  const publicFarmerRoutes = ['/farmer', '/farmer/login', '/farmer/register'];
  const isPublicRoute = publicFarmerRoutes.includes(pathname);

  // If user visits public farmer routes, do NOT render the authenticated navbar/layout wrapper
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Redirect to login if unauthenticated on protected routes
  if (!isLoading && !isAuthenticated) {
    router.push('/farmer/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Demo Bar */}
      <div className="bg-emerald-900 text-emerald-100 text-[11px] font-semibold py-1.5 px-4 flex items-center justify-between border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AgriFlow AI â€¢ Dedicated Farmer & FPO Experience</span>
        </div>
        <div className="flex items-center gap-4">
          <LowBandwidthToggle />
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="hover:text-white flex items-center gap-1 font-bold text-xs"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'à¤¹à¤¿à¤¨à¥à¤¦à¥€' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Main Authenticated Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/farmer/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/30">
              ðŸŒ¾
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">AgriFlow <span className="text-emerald-500">Farmer</span></span>
              <span className="text-[10px] block font-medium text-slate-400">Direct Demand & Logistics</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-500' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Utilities & Profile Menu */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0] : 'F'}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">{user?.farmName || user?.location}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{user?.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{user?.phone}</span>
                  </div>
                  <Link
                    href="/farmer/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('profile')}</span>
                  </Link>
                  <Link
                    href="/farmer/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('settings')}</span>
                  </Link>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    onClick={() => { setProfileDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-emerald-500' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-1">
              <Link
                href="/farmer/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <User className="w-4 h-4" />
                <span>{t('profile')}</span>
              </Link>
              <Link
                href="/farmer/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Settings className="w-4 h-4" />
                <span>{t('settings')}</span>
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>Â© 2026 AgriFlow AI â€” Dedicated Farmer & FPO Experience â€¢ Road Logistics Only â€¢ Verified Cold-Chain Telemetry</p>
      </footer>
    </div>
  );
}
