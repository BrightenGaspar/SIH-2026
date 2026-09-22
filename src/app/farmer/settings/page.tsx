'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useBandwidth } from '@/context/BandwidthContext';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Sun, Moon, Zap, ZapOff, Languages, LogOut } from 'lucide-react';
import { LanguageSelector } from '@/components/common/LanguageSelector';

export default function FarmerSettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { isLowBandwidth, toggleLowBandwidth } = useBandwidth();
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Farmer Portal
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('settings')}</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Configure language, bandwidth consumption, and display theme preferences.</p>
      </div>

      <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        
        {/* Language setting */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {t('preferredLanguage')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Select preferred display language across all devices.</p>
          </div>
          <LanguageSelector variant="cards" />
        </div>

        {/* Low Bandwidth Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isLowBandwidth ? <ZapOff className="w-4 h-4 text-amber-500 dark:text-amber-400" /> : <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              Low-Bandwidth Mode
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Replaces interactive maps with tables and simplifies rendering for rural 2G/3G connections.</p>
          </div>
          <Button
            variant={isLowBandwidth ? 'amber' : 'secondary'}
            size="sm"
            onClick={toggleLowBandwidth}
            className="cursor-pointer font-bold"
          >
            {isLowBandwidth ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Theme mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              Theme Mode
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Toggle between High-Contrast Dark and Clean Light theme.</p>
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

        {/* Logout */}
        <div className="pt-2 flex justify-between items-center flex-wrap gap-4">
          <span className="text-xs text-slate-600 dark:text-slate-400">Sign out of this session on this device.</span>
          <Button variant="danger" size="sm" onClick={logout} className="cursor-pointer font-bold">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Logout</span>
          </Button>
        </div>

      </Card>

    </div>
  );
}
