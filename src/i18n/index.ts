/**
 * i18n setup — react-i18next + browser language detector.
 *
 * Coverage MVP : FR (fallback) + EN.
 * Detection : localStorage 'rifflab-locale' puis navigator.language.
 * Si navigator commence par 'fr' → fr ; sinon en.
 *
 * Le sélecteur dans Settings appelle setLocale(id) qui persiste via
 * i18next-browser-languagedetector (localStorage).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from './locales/fr.json';
import en from './locales/en.json';

export type LocaleId = 'fr' | 'en';
export const LOCALES: { id: LocaleId; label: string; flag: string }[] = [
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
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

// Sync <html lang> avec la langue active — important pour les lecteurs
// d'écran qui doivent prononcer le texte avec la bonne phonétique.
function syncHtmlLang(lang: string | undefined) {
  if (typeof document === 'undefined' || !lang) return;
  document.documentElement.lang = lang;
}
syncHtmlLang(i18n.resolvedLanguage);
i18n.on('languageChanged', syncHtmlLang);

export function setLocale(locale: LocaleId): void {
  void i18n.changeLanguage(locale);
}

export default i18n;
