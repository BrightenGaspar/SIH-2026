'use client';

import React, { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { 
  Settings, 
  Globe, 
  Wifi, 
  Bell, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Moon, 
  Sun,
  Smartphone,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/common/Button';

export default function ConsumerSettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const { logoutConsumer } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = () => {
    localStorage.removeItem('agriflow_consumer_auth');
    localStorage.removeItem('agriflow_cart');
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Consumer Preferences & Network
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">System Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
          Application Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Multi-lingual localization, display themes, low-bandwidth mode for rural mandi connections, and session controls.
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/40">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('preferredLanguage')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Synchronized across all your devices and marketplace sessions
              </p>
            </div>
          </div>

          <LanguageSelector variant="cards" />
        </div>

        {/* Display Theme Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 border border-blue-300/60 dark:border-blue-700/40">
                {theme === 'dark' ? <Moon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> : <Sun className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Display Theme Mode
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Switch between Clean Light Mode and High-Contrast Dark Theme.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Low-Bandwidth Mode */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400 border border-cyan-300/60 dark:border-cyan-700/40">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Low-Bandwidth & Network Optimization
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Compresses crop inspection images and prioritizes essential tabular price data on 2G/3G mandi networks.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Enable Rural Network Optimization
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Disables high-resolution farm inspection zoom & lowers GPS polling frequency to save data.
              </span>
            </div>
            <input
              type="checkbox"
              checked={lowBandwidthMode}
              onChange={(e) => setLowBandwidthMode(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Application Session Reset & Signout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-300/70 dark:border-rose-800/60 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300/60 dark:border-rose-700/40">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Workspace Session &amp; Cache Reset
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Clear temporary session storage, local cart items, and reset cached workspace state.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
            {resetSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Session cache cleared successfully
              </span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Clears active browser state and refreshes application session.
              </span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                Reset Session State
              </button>
              <Button
                variant="danger"
                size="sm"
                onClick={logoutConsumer}
                className="cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
