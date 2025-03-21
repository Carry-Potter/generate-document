// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Inicijalizacija i18n
const i18nInstance = i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next);

// Odvojena inicijalizacija sa čekanjem da se završi
i18nInstance.init({
  fallbackLng: 'sr',
  supportedLngs: ['sr', 'en'],
  debug: process.env.NODE_ENV === 'development',
  ns: ['common', 'errors', 'forms'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['path', 'localStorage', 'cookie', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  react: {
    useSuspense: false,
  },
});

export default i18nInstance;