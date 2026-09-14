'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';
import { Globe, Check, ChevronDown, AlertCircle } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'cards' | 'select';
  className?: string;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({
  variant = 'compact',
  className = '',
  onSelectLanguage,
}: LanguageSelectorProps) {
  const { language, setLanguage, t, supportedLanguages } = useI18n();
  const { user, consumerUser, updateFarmerProfile, updateConsumerProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (newLang === language && !onSelectLanguage) {
      setDropdownOpen(false);
      return;
    }
    setErrorMsg('');
    try {
      setLanguage(newLang);
      if (onSelectLanguage) {
        onSelectLanguage(newLang);
      }
      setDropdownOpen(false);

      // Non-blocking user profile sync if authenticated
      if (user && updateFarmerProfile) {
        updateFarmerProfile({ language: newLang } as any).catch(() => {});
      } else if (consumerUser && updateConsumerProfile) {
        updateConsumerProfile({ language: newLang } as any).catch(() => {});
      }
    } catch {
      setErrorMsg(t('saveError', 'Unable to save language preference.'));
    }
  };

  const currentOption = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  // VARIANT 1: COMPACT (Navbar / Header dropdown with Globe Icon)
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          title="Select Language / भाषा चुनें"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{currentOption.nativeLabel}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Select Language
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {supportedLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{lang.nativeLabel}</span>
                      <span className="text-[10px] text-slate-400">{lang.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // VARIANT 2: CARDS (Grid of language tiles for Settings / Onboarding)
  if (variant === 'cards') {
    return (
      <div className={`space-y-3 ${className}`}>
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-bold">{lang.nativeLabel}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{lang.label}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // VARIANT 3: SELECT (Standard form select input)
  return (
    <div className={`relative ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('selectLanguage', 'Select Language')}
      </label>
      <div className="relative">
        <select
          id="language-select"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeLabel} ({lang.label})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
