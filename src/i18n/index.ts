import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Language } from '@/lib/types';

import en from './en.json';
import ru from './ru.json';
import uk from './uk.json';

const supported = ['en', 'uk', 'ru'] as const;

export function resolveLanguage(pref: Language): string {
  if (pref !== 'system') return pref;
  const device = getLocales()[0]?.languageCode ?? 'en';
  return (supported as readonly string[]).includes(device) ? device : 'en';
}

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, uk: { translation: uk }, ru: { translation: ru } },
  lng: resolveLanguage('system'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
