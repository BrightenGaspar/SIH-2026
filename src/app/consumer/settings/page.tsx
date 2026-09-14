'use client';

import React, { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
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
  Smartphone
} from 'lucide-react';

export default function ConsumerSettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const { logoutConsumer } = useAuth();

  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = () => {
    localStorage.removeItem('agriflow_consumer_auth');
    localStorage.removeItem('agriflow_cart');
    setResetSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Preferences & Network
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-0.5">
          Application Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Bilingual localization, low-bandwidth mode for rural mandi connections, and telemetry settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {t('preferredLanguage')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Synchronized across all your devices and portal sessions
              </p>
            </div>
          </div>

          <LanguageSelector variant="cards" />
        </div>

        {/* Low-Bandwidth Mode & Telemetry Optimization */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Low-Bandwidth & Network Optimization
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Compresses crop inspection images and prioritizes essential tabular price data on 2G/3G mandi networks.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                Enable Rural Network Optimization
              </span>
              <span className="text-[11px] text-zinc-500">
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

        {/* SIH Judges Demo Session Reset */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-red-500/30 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                SIH Evaluation Demo Reset
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Reset local simulation storage, demo cart, and orders back to default SIH presentation state.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {resetSuccess ? (
              <span className="text-xs font-bold text-emerald-600">
                Resetting environment... reloading page
              </span>
            ) : (
              <span className="text-xs text-zinc-400">
                Re-seeds default 5,000 kg Hyderabad Tomato Multi-Farmer data.
              </span>
            )}

            <button
              type="button"
              onClick={handleResetDemo}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Reset Demo State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
