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
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('settings')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure language, bandwidth consumption, and theme preferences.</p>
      </div>

      <Card className="p-6 space-y-6">
        
        {/* Language setting */}
        <div className="space-y-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-emerald-400" /> {t('preferredLanguage')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Select preferred display language across all devices.</p>
          </div>
          <LanguageSelector variant="cards" />
        </div>

        {/* Low Bandwidth Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isLowBandwidth ? <ZapOff className="w-4 h-4 text-amber-400" /> : <Zap className="w-4 h-4 text-emerald-400" />}
              Low-Bandwidth Mode
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Replaces interactive maps with tables and simplifies rendering for rural 2G/3G connections.</p>
          </div>
          <Button
            variant={isLowBandwidth ? 'amber' : 'secondary'}
            size="sm"
            onClick={toggleLowBandwidth}
          >
            {isLowBandwidth ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Theme mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              Theme Mode
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle between High-Contrast Dark and Clean Light theme.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </div>

        {/* Logout */}
        <div className="pt-2 flex justify-between items-center">
          <span className="text-xs text-slate-400">Sign out of this session on this device.</span>
          <Button variant="danger" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>

      </Card>

    </div>
  );
}
