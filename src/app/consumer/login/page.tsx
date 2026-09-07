'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { 
  LogIn, 
  Store, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Utensils, 
  ShoppingBag, 
  Home 
} from 'lucide-react';

export default function ConsumerLoginPage() {
  const router = useRouter();
  const { loginConsumer } = useAuth();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('rajesh.varma@southern-procure.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginConsumer(identifier, password);
      router.push('/consumer/dashboard');
    } catch {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDemoRole = async (email: string) => {
    setIdentifier(email);
    setPassword('demoPass123');
    setLoading(true);
    try {
      await loginConsumer(email, 'demoPass123');
      router.push('/consumer/dashboard');
    } catch {
      setError('Failed to login demo role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
          Buyer Portal Login
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Direct farm-gate access with escrow safety & AI grade verification
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email or Mobile Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. buyer@agriflow.in or 9848012345"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-zinc-400">Demo PIN: 1234</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In to Buyer Portal
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins for SIH Judges */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
            ⚡ Quick SIH Demo Personas
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuickDemoRole('rajesh.varma@southern-procure.in')}
              className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors"
            >
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Bulk Buyer
              </span>
              <span className="text-[10px] text-zinc-500 block">5 Ton Hyderabad Tomato</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickDemoRole('chef.ananya@royalbengal.com')}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-colors"
            >
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-500" /> Restaurant
              </span>
              <span className="text-[10px] text-zinc-500 block">Chef Ananya (150 kg)</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickDemoRole('suresh.retail@freshmart.in')}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-colors"
            >
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-500" /> Supermarket
              </span>
              <span className="text-[10px] text-zinc-500 block">FreshMart Superstore</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickDemoRole('sunita.sharma@gmail.com')}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-colors"
            >
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-purple-500" /> Household
              </span>
              <span className="text-[10px] text-zinc-500 block">Family Kitchen (10 kg)</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          New buyer on AgriFlow?{' '}
          <Link href="/consumer/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
