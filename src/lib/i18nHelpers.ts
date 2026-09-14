import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * Replace {param} placeholders inside a translation template string.
 */
export function formatTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * Retrieve the native script display label for a language code.
 */
export function getLanguageNativeName(code: string): string {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found ? found.nativeLabel : code;
}

/**
 * Retrieve the English display label for a language code.
 */
export function getLanguageDisplayName(code: string): string {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found ? found.label : code;
}

/**
 * Translate dynamic user roles with fallback.
 */
export function translateRole(
  role: string | undefined | null,
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string
): string {
  if (!role) return '';
  const normalized = role.toLowerCase().trim();
  const map: Record<string, { key: string; fallback: string }> = {
    farmer: { key: 'farmer', fallback: 'Farmer' },
    consumer: { key: 'consumer', fallback: 'Consumer' },
    buyer: { key: 'buyer', fallback: 'Buyer' },
    logistics: { key: 'logistics', fallback: 'Logistics' },
    admin: { key: 'admin', fallback: 'Admin' },
    fpo: { key: 'fpo', fallback: 'FPO' },
  };

  const item = map[normalized];
  return item ? t(item.key, item.fallback) : role;
}

/**
 * Translate order, trip, or listing statuses.
 */
export function translateStatus(
  status: string | undefined | null,
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string
): string {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/[\s_-]+/g, '_').trim();
  const map: Record<string, { key: string; fallback: string }> = {
    pending: { key: 'statusPending', fallback: 'Pending' },
    active: { key: 'statusActive', fallback: 'Active' },
    confirmed: { key: 'statusConfirmed', fallback: 'Confirmed' },
    in_transit: { key: 'statusInTransit', fallback: 'In Transit' },
    delivered: { key: 'statusDelivered', fallback: 'Delivered' },
    completed: { key: 'statusCompleted', fallback: 'Completed' },
    cancelled: { key: 'statusCancelled', fallback: 'Cancelled' },
    failed: { key: 'statusFailed', fallback: 'Failed' },
    harvested: { key: 'statusHarvested', fallback: 'Harvested' },
    ready: { key: 'statusReady', fallback: 'Ready' },
  };

  const item = map[normalized];
  return item ? t(item.key, item.fallback) : status;
}

/**
 * Translate agricultural produce crop categories.
 */
export function translateCategory(
  category: string | undefined | null,
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string
): string {
  if (!category) return '';
  const normalized = category.toLowerCase().trim();
  const map: Record<string, { key: string; fallback: string }> = {
    vegetables: { key: 'catVegetables', fallback: 'Vegetables' },
    fruits: { key: 'catFruits', fallback: 'Fruits' },
    grains: { key: 'catGrains', fallback: 'Grains' },
    pulses: { key: 'catPulses', fallback: 'Pulses' },
    spices: { key: 'catSpices', fallback: 'Spices' },
    dairy: { key: 'catDairy', fallback: 'Dairy' },
    oilseeds: { key: 'catOilseeds', fallback: 'Oilseeds' },
  };

  const item = map[normalized];
  return item ? t(item.key, item.fallback) : category;
}

/**
 * Format localized Indian Rupee currency.
 */
export function formatLocalizedCurrency(
  amount: number,
  locale: SupportedLanguage = 'en'
): string {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
  };

  try {
    return new Intl.NumberFormat(localeMap[locale] || 'en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Format localized date with language awareness.
 */
export function formatLocalizedDate(
  date: Date | string | number,
  locale: SupportedLanguage = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
  };

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(localeMap[locale] || 'en-IN', defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
