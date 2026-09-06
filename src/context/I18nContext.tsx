'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    myProduce: 'My Produce',
    mandiPrices: 'Mandi Prices',
    demandMap: 'Demand Map',
    aiRecommendations: 'AI Recommendations',
    ordersAndDelivery: 'Orders & Delivery',
    addProduce: '+ Add Produce',
    todaysOpportunities: "Today's Opportunities",
    marketSnapshot: 'Market Snapshot',
    bestTimeToSell: 'Best Time to Sell',
    groupSelling: 'Group Selling / Produce Pooling',
    roadLogistics: 'Road Logistics',
    viewTracking: 'View Tracking',
    joinGroup: 'Join Group Pool',
    createPool: 'Create Pool',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    lowBandwidth: 'Low Bandwidth',
    perishableRisk: 'Perishable Risk',
    returnLoad: 'Return Load Matching',
    farmerBenefit: 'Farmer Impact & Realization',
    conventional: 'Conventional Mandi',
    agriflowRealization: 'AgriFlow Direct Realization',
  },
  hi: {
    dashboard: 'डैशबोर्ड (Dashboard)',
    myProduce: 'मेरी उपज (My Produce)',
    mandiPrices: 'मंडी भाव (Mandi Prices)',
    demandMap: 'मांग नक्शा (Demand Map)',
    aiRecommendations: 'एआई सिफारिशें (AI Recommendations)',
    ordersAndDelivery: 'ऑर्डर और डिलीवरी (Orders & Delivery)',
    addProduce: '+ उपज जोड़ें',
    todaysOpportunities: 'आज के अवसर',
    marketSnapshot: 'बाजार भाव विवरण',
    bestTimeToSell: 'बेचने का सही समय',
    groupSelling: 'समूह बिक्री / उपज पूलिंग',
    roadLogistics: 'सड़क परिवहन लॉजिस्टिक्स',
    viewTracking: 'ट्रैकिंग देखें',
    joinGroup: 'ग्रुप में शामिल हों',
    createPool: 'पूल बनाएं',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    lowBandwidth: 'कम बैंडविड्थ मोड',
    perishableRisk: 'खराब होने का जोखिम',
    returnLoad: 'वापसी भाड़ा मैचिंग',
    farmerBenefit: 'किसान लाभ व आमदनी',
    conventional: 'पारंपरिक मंडी भाव',
    agriflowRealization: 'एग्रीफ्लो सीधी प्राप्ति',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('agriflow_lang') as Language;
    if (saved === 'en' || saved === 'hi') setLanguageState(saved);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agriflow_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
