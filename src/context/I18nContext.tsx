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
    marketplace: 'Marketplace',
    cart: 'Cart',
    orders: 'Orders',
    tracking: 'Tracking',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
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
    browseMarketplace: 'Browse Marketplace',
    knowYourFarmer: 'Know Your Farmer',
    priceTransparency: 'Price Transparency',
    impactReceipt: 'Impact Receipt',
    coldChainTelemetry: 'Cold-Chain Telemetry',
    freshness: 'Harvest Freshness',
    farmerReceives: 'Farmer Receives',
    consumerPrice: 'Consumer Price',
    roadLogisticsFee: 'Road Logistics',
    platformFee: 'Platform Fee',
    bulkDemand: 'Create Bulk Demand',
    multiFarmerFulfillment: 'Multi-Farmer Fulfillment',
    viewDetails: 'View Details',
    addToCart: 'Add to Cart',
    checkout: 'Proceed to Checkout',
    activeDeliveries: 'Active Deliveries',
    recommendedForYou: 'AI Recommended Produce',
    lowBandwidth: 'Low Bandwidth',
    perishableRisk: 'Perishable Risk',
    returnLoad: 'Return Load Matching',
    farmerBenefit: 'Farmer Impact & Realization',
    conventional: 'Conventional Mandi',
    agriflowRealization: 'AgriFlow Direct Realization',
  },
  hi: {
    dashboard: 'Ð䥎�ॎ₻Ð��ₜ⤥ₜ⤥₵ (Dashboard)',
    marketplace: 'ैंडै बाजार (Marketplace)',
    cart: 'टोकरी (Cart)',
    orders: 'ऑर्डर (Orders)',
    tracking: 'लाइव ट्रैकिंग (Tracking)',
    profile: '४्लोૃाईल (Profile)',
    settings: 'सेटिंगस (Settings)',
    logout: 'लॉग आउट (Logout)',
    login: 'लॉग इन (Login)',
    register: 'पंजीकरण (Register)',
    myProduce: 'मेरी उपज (My Produce)',
    mandiPrices: 'मंडी भाव (Mandi Prices)',
    demandMap: 'म社ं नक्शा (Demand Map)',
    aiRecommendations: 'एआई सि૧ारिशे (AI Recommendations)',
    ordersAndDelivery: 'ऑरऍ炨र और डिलीवरी',
    addProduce: '+ उपज जोड़ेट',
    todaysOpportunities: 'आज के अवसर',
    marketSnapshot: 'बाजार भाऱ विवरण’',
    bestTimeToSell: 'बेचने का सही समॏ',
    groupSelling: 'समूह बिक्री / उपज पूलिंग',
    roadLogistics: 'सडऽ परिवहन लॉजिस्टिक्स',
    viewTracking: 'ट्रैचोळ देखेश',
    browseMarketplace: 'उत्पादक देखेल (Marketplace',
    knowYourFarmer: 'किसान को जानेन (Know Your Farmer)',
    priceTransparency: 'बूल्ळ पारदर्शिता (Price Breakdown(',
    impactReceipt: 'खरीद प्रभाव रसी (Impact Receipt)',
    coldChainTelemetry: 'कोल्ड-dचेन तापमान (Cold-Chain)',
    freshness: 'कटाई की ताजगी (Freshness)',
    farmerReceives: 'किसान को मिला',
    consumerPrice: 'उपभोक्ता मूल्य',
    roadLogisticsFee: 'सडि परिवहन भाडाऱ',
    platformFee: '्लेट्फॉर्म शूल्क',
    bulkDemand: 'थोक मांग दर्ज करें (Bulk Demand)',
    multiFarmerFulfillment: 'बहु-कि�.ान समेकन',
    viewDetails: 'विवरण देखेश',
    addToCart: 'कार्ट में जोडेऺ (Add to Cart)',
    checkout: 'भु�_तान करें (Checkout)',
    activeDeliveries: 'सक्रिय डीलीवरी',
    recommendedForYou: 'एआ	 अनुशंसित उपज',
    lowBandwidth: 'कम बैंडविड्थ मोड',
    perishableRisk: 'खराब होने का जोखिम',
    returnLoad: 'वापसी भाड़ा मैचिंग',
    farmerBenefit: 'कि�.ान लाभर वी आमदनी',
    conventional: 'पारंपरिक मंडी भाव',
    agriflowRealization: 'एग्री फ्लो सोताी वास्ति',
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
    const currentMap = translations[language] || translations['en'];
    return (currentMap as Record<string, string>)[key] || (translations['en'] as Record<string, string>)[key] || key;
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
