'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  dictionaries,
  DEFAULT_LANGUAGE,
} from '@/i18n';
import { formatTranslation } from '@/lib/i18nHelpers';

export { SUPPORTED_LANGUAGES };
export type { SupportedLanguage, LanguageOption };

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  syncWithUserProfile: (lang?: SupportedLanguage) => void;
  t: (
    key: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ) => string;
  supportedLanguages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'app_language';
const LEGACY_STORAGE_KEY = 'agriflow_cached_lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  // 1. Hydrate language preference from localStorage on mount and set <html lang="...">
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as SupportedLanguage;
      if (stored && dictionaries[stored]) {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      } else {
        document.documentElement.lang = DEFAULT_LANGUAGE;
      }
    }
  }, []);

  // 2. Set language, update document language, and persist in localStorage
  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (!dictionaries[newLang]) return;
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem(LEGACY_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    }
  }, []);

  // 3. Synchronize language from authenticated backend user profile (Source of Truth)
  const syncWithUserProfile = useCallback((userLang?: SupportedLanguage) => {
    if (userLang && dictionaries[userLang]) {
      setLanguage(userLang);
    }
  }, [setLanguage]);

  // 4. Production-grade translation function with fallback hierarchy & parameter substitution
  // Fallback hierarchy:
  // 1. Key in selected language dictionary
  // 2. Key in English ('en') dictionary
  // 3. User-provided fallback string
  // 4. Raw key name
  const t = useCallback(
    (
      key: string,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      let params: Record<string, string | number> | undefined;
      let explicitFallback: string | undefined;

      if (typeof paramsOrFallback === 'string') {
        explicitFallback = paramsOrFallback;
      } else if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
        params = paramsOrFallback;
        explicitFallback = fallback;
      } else {
        explicitFallback = fallback;
      }

      const currentDict = dictionaries[language];
      const enDict = dictionaries[DEFAULT_LANGUAGE];

      let rawText = currentDict?.[key];
      if (!rawText && enDict) {
        rawText = enDict[key];
      }
      if (!rawText) {
        rawText = explicitFallback !== undefined ? explicitFallback : key;
      }

      return formatTranslation(rawText, params);
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        syncWithUserProfile,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
