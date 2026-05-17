/**
 * i18n setup — react-i18next + browser language detector.
 *
 * MVP : 2 langues (fr default + en). Resources inline (importés ESM).
 * Fallback fr partout. La langue est aussi persistée dans Zustand
 * (cf usePrefs.locale) — i18next-browser-languagedetector cache via
 * localStorage en plus, mais on respecte le choix Zustand au boot.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';

export type LocaleId = 'fr' | 'en';
export const LOCALES: { id: LocaleId; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'rifflab-locale',
    },
  });

export function setLocale(locale: LocaleId): void {
  void i18n.changeLanguage(locale);
}

export default i18n;
