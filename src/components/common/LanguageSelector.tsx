'use client';

import React, { useState } from 'react';
import { useI18n, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { Languages, Check, Loader2, AlertCircle } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'cards' | 'select';
  className?: string;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({ variant = 'select', className = '', onSelectLanguage }: LanguageSelectorProps) {
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const { user, consumerUser, logisticsUser, updateFarmerLanguage, updateConsumerLanguage, updateLogisticsLanguage } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    if (newLang === language && !onSelectLanguage) return;
    setUpdating(true);
    setErrorMsg('');
    try {
      setLanguage(newLang);
      if (onSelectLanguage) {
        onSelectLanguage(newLang);
      }
      if (user && updateFarmerLanguage) {
        await updateFarmerLanguage(newLang);
      } else if (consumerUser && updateConsumerLanguage) {
        await updateConsumerLanguage(newLang);
      } else if (logisticsUser && updateLogisticsLanguage) {
        await updateLogisticsLanguage(newLang);
      }
    } catch {
      setErrorMsg(t('saveError') || 'Unable to save language preference. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (variant === 'cards') {
    return (
      <div className={`space-y-3 ${className}`}>
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={updating}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 text-emerald-400 font-bold'
                    : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-sm font-bold block">{lang.nativeLabel}</span>
                  <span className="text-[11px] text-slate-400 block">{lang.label}</span>
                </div>
                {isSelected && (
                  updating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Check className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center gap-1 ${className}`}>
        <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          disabled={updating}
          aria-label="Select Language"
          className="bg-slate-900 text-white text-[11px] sm:text-xs font-bold border border-slate-700 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 outline-none focus:border-emerald-500 cursor-pointer max-w-[110px] sm:max-w-none"
        >
          {supportedLanguages.map((l) => (
            <option key={l.code} value={l.code} className="bg-slate-900 text-white py-1">
              {l.nativeLabel} ({l.label})
            </option>
          ))}
        </select>
        {updating && <Loader2 className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
        <Languages className="w-3.5 h-3.5 text-emerald-400" />
        <span>{t('preferredLanguage')} *</span>
      </label>
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        disabled={updating}
        className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none"
      >
        {supportedLanguages.map((l) => (
          <option key={l.code} value={l.code} className="bg-slate-900 text-white">
            {l.nativeLabel} - {l.label}
          </option>
        ))}
      </select>
      {errorMsg && (
        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
        </p>
      )}
    </div>
  );
}
