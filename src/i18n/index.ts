import { en, TranslationKey } from './en';
import { zh } from './zh';

export type Language = 'en' | 'zh';

const translations = { en, zh };

export function t(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  let result: any = translations[lang];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ];
}

export { TranslationKey };