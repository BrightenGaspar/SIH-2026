'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { 
  Store, 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Truck, 
  User, 
  Settings, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { consumerUser, isConsumerAuthenticated, logoutConsumer } = useAuth();
  const { totalItems } = useCart();
  const { t, language, setLanguage } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicPage = pathname === '/consumer' || pathname === '/consumer/login' || pathname === '/consumer/register';

  const navLinks = [
    { href: '/consumer/dashboard', label: t('dashboard'), icon: LayoutDashboard, authRequired: true },
    { href: '/consumer/marketplace', label: t('marketplace'), icon: Store, authRequired: false },
    { href: '/consumer/cart', label: 'Cart', icon: ShoppingBag, authRequired: false },
    { href: '/consumer/orders', label: t('orders'), icon: Package, authRequired: true },
    { href: '/consumer/tracking', label: 'GPS Tracking', icon: Truck, authRequired: false },
  ];

  const handleLogout = () => {
    logoutConsumer();
    setMobileMenuOpen(false);
    router.push('/consumer');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Banner for SIH & Gateway Link */}
      <div className="bg-emerald-900 text-emerald-100 px-4 py-1.5 text-xs flex items-center justify-between border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AgriFlow AI
          </span>
          <span className="hidden sm:inline text-emerald-300">• Direct Farmer-to-Consumer Wholesale & Retail Portal</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="text-emerald-200 hover:text-white font-medium transition-colors"
          >
            {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 text-emerald-200 hover:text-white font-semibold transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Main Gateway
          </Link>
        </div>
      </div>

      {/* Main Consumer Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-6">
            <Link href="/consumer" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                  AgriFlow <span className="text-emerald-600 dark:text-emerald-400">Buyer</span>
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block -mt-1 font-medium tracking-wide">
                  Direct Farm Sourcing Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.authRequired && !isConsumerAuthenticated) return null;
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls (Cart, User, Auth CTAs) */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <Link
              href="/consumer/cart"
              className="relative p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User State or Auth Buttons */}
            {isConsumerAuthenticated && consumerUser ? (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/consumer/profile"
                  className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    {consumerUser.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block leading-tight">
                      {consumerUser.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium capitalize">
                      {consumerUser.buyerType.replace('-', ' ')}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/consumer/login"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> {t('login')}
                </Link>
                <Link
                  href="/consumer/register"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" /> {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4">
            {isConsumerAuthenticated && consumerUser && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {consumerUser.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white block">
                      {consumerUser.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                      {consumerUser.buyerType.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}

            <div className="space-y-1">
              {navLinks.map((link) => {
                if (link.authRequired && !isConsumerAuthenticated) return null;
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {!isConsumerAuthenticated && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2">
                <Link
                  href="/consumer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 rounded-xl"
                >
                  <LogIn className="w-4 h-4" /> {t('login')}
                </Link>
                <Link
                  href="/consumer/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl"
                >
                  <UserPlus className="w-4 h-4" /> {t('register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Portal-Specific Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white">AgriFlow AI Buyer Portal</span>
            <span>• Direct Farm-Gate Procurement & Verified Cold-Chain Road Sourcing</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/consumer/marketplace" className="hover:text-emerald-600 transition-colors">
              Marketplace
            </Link>
            <Link href="/consumer/settings" className="hover:text-emerald-600 transition-colors">
              Settings & Bandwidth
            </Link>
            <Link href="/" className="hover:text-emerald-600 font-semibold transition-colors">
              Main Gateway
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
