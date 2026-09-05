import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enProducts from './locales/en/products.json';
import enCart from './locales/en/cart.json';
import enOrders from './locales/en/orders.json';
import enAdmin from './locales/en/admin.json';
import enValidation from './locales/en/validation.json';

// Hindi
import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiProducts from './locales/hi/products.json';
import hiCart from './locales/hi/cart.json';
import hiOrders from './locales/hi/orders.json';
import hiAdmin from './locales/hi/admin.json';
import hiValidation from './locales/hi/validation.json';

// Gujarati
import guCommon from './locales/gu/common.json';
import guAuth from './locales/gu/auth.json';
import guProducts from './locales/gu/products.json';
import guCart from './locales/gu/cart.json';
import guOrders from './locales/gu/orders.json';
import guAdmin from './locales/gu/admin.json';
import guValidation from './locales/gu/validation.json';

export const supportedLanguages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]['code'];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    products: enProducts,
    cart: enCart,
    orders: enOrders,
    admin: enAdmin,
    validation: enValidation,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    products: hiProducts,
    cart: hiCart,
    orders: hiOrders,
    admin: hiAdmin,
    validation: hiValidation,
  },
  gu: {
    common: guCommon,
    auth: guAuth,
    products: guProducts,
    cart: guCart,
    orders: guOrders,
    admin: guAdmin,
    validation: guValidation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'products', 'cart', 'orders', 'admin', 'validation'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'en';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng || 'en';
  });
}

export default i18n;
