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
  Bell
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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Fleet Operations & Telematics
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-500 font-mono">System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Logistics Fleet Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure regional language, cold-chain sensor alerting thresholds, low-bandwidth mode, and telemetry polling.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Fleet telemetry preferences saved successfully!</span>
        </div>
      )}

      {/* 1. Language Preference */}
      <Card className="p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t('preferredLanguage')}
            </h3>
            <p className="text-xs text-slate-500">
              Select driver interface and dispatch language across regional corridors.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <LanguageSelector variant="cards" />
        </div>
      </Card>

      {/* 2. Bandwidth & Network Mode */}
      <Card className="p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              {isLowBandwidth ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Low-Bandwidth Mode (Rural Highway 2G/3G)
              </h3>
              <p className="text-xs text-slate-500">
                Replaces heavy interactive satellite maps with fast, text-first road telemetry tables.
              </p>
            </div>
          </div>

          <Button
            variant={isLowBandwidth ? 'amber' : 'secondary'}
            size="sm"
            onClick={toggleLowBandwidth}
            className="cursor-pointer"
          >
            {isLowBandwidth ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </Card>

      {/* 3. Cold Chain Telemetry Alerting */}
      <Card className="p-6 space-y-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cold Chain & Reefer Monitoring Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative temperature safety limits and automated driver notification triggers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
                <span className="text-xs text-slate-500 font-bold shrink-0">°C Threshold</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Readings above this temperature trigger high-priority alerts to prevent crop spoilage.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Telemetry Ping Polling Frequency
              </label>
              <select
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="5s">5 Seconds (Real-time Live Telemetry)</option>
                <option value="15s">15 Seconds (Balanced Highway Transit)</option>
                <option value="30s">30 Seconds (Low Battery & Data Saver)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Frequency for phone GPS beacons and IoT hardware telemetry reports.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Save Telematics Preferences
            </button>
          </div>
        </form>
      </Card>

      {/* 4. Display Theme */}
      <Card className="p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Theme Mode
              </h3>
              <p className="text-xs text-slate-500">
                Switch between clean light view and high-contrast night driving theme.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
            className="cursor-pointer"
          >
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </div>
      </Card>

      {/* 5. Account & Session */}
      <Card className="p-6 space-y-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operator Session
            </h3>
            <p className="text-xs text-slate-500">
              Sign out of this logistics operator session on this device.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            className="cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
