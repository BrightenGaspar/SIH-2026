import { en } from './en';
import { hi } from './hi';
import { te } from './te';
import { ta } from './ta';
import { ml } from './ml';
import { mr } from './mr';
import { bn } from './bn';

export { en, hi, te, ta, ml, mr, bn };

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'ml' | 'mr' | 'bn';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', direction: 'ltr' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', direction: 'ltr' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', direction: 'ltr' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', direction: 'ltr' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', direction: 'ltr' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', direction: 'ltr' },
];

export const dictionaries: Record<SupportedLanguage, Record<string, string>> = {
  en,
  hi,
  te,
  ta,
  ml,
  mr,
  bn,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export type TranslationKey = keyof typeof en;
