'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { 
  Sun, 
  Moon, 
  Zap, 
  ZapOff, 
  Languages, 
  LogOut, 
  Radio, 
  ThermometerSnowflake, 
  Truck, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck,
  Bell,
  Sparkles
} from 'lucide-react';

export default function LogisticsSettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isLowBandwidth, toggleLowBandwidth } = useBandwidth();
  const { t } = useI18n();
  const { logoutLogistics } = useAuth();

  const [telemetryInterval, setTelemetryInterval] = useState<'5s' | '15s' | '30s'>('5s');
  const [tempAlertThreshold, setTempAlertThreshold] = useState<number>(8.0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = async () => {
    await logoutLogistics();
    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Fleet Operations & Telematics
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Logistics Fleet Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configure regional language, cold-chain sensor alerting thresholds, low-bandwidth mode, and telemetry polling.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Fleet telemetry preferences saved successfully!</span>
        </div>
      )}

      {/* 1. Language Preference */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/40">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('preferredLanguage')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select driver interface and dispatch language across regional corridors.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <LanguageSelector variant="cards" />
        </div>
      </Card>

      {/* 2. Bandwidth & Network Mode */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/40">
              {isLowBandwidth ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Low-Bandwidth Mode (Rural Highway 2G/3G)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Replaces heavy interactive satellite maps with fast, text-first road telemetry tables.
              </p>
            </div>
          </div>

          <Button
            variant={isLowBandwidth ? 'amber' : 'secondary'}
            size="sm"
            onClick={toggleLowBandwidth}
            className={`cursor-pointer font-bold ${isLowBandwidth ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'}`}
          >
            {isLowBandwidth ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </Card>

      {/* 3. Cold Chain Telemetry Alerting */}
      <Card className="p-6 space-y-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/40">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cold Chain & Reefer Monitoring Configuration
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Authoritative temperature safety limits and automated driver notification triggers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Maximum Safe Reefer Temperature (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={tempAlertThreshold}
                  onChange={(e) => setTempAlertThreshold(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold shrink-0">°C Threshold</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Readings above this temperature trigger high-priority alerts to prevent crop spoilage.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Telemetry Ping Polling Frequency
              </label>
              <select
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="5s" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">5 Seconds (Real-time Live Telemetry)</option>
                <option value="15s" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">15 Seconds (Balanced Highway Transit)</option>
                <option value="30s" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">30 Seconds (Low Battery & Data Saver)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Frequency for phone GPS beacons and IoT hardware telemetry reports.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save Telematics Preferences</span>
            </button>
          </div>
        </form>
      </Card>

      {/* 4. Display Theme */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/40">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> : <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Theme Mode
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Switch between clean light view and high-contrast night driving theme.
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
      </Card>

      {/* 5. Account & Session */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Operator Session
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sign out of this logistics operator session on this device.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            className="cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
