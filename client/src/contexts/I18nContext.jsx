import React, { createContext, useContext, useState, useCallback } from 'react';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

const I18nContext = createContext(null);

const LANG_KEY = 'speedbac_ui_lang';

const translations = { fr, en };

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && translations[stored]) return stored;
    const browserLang = navigator.language?.slice(0, 2);
    return browserLang === 'fr' ? 'fr' : 'en';
  });

  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem(LANG_KEY, newLang);
    }
  }, []);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.fr;
    return dict[key] || key;
  }, [lang]);

  const value = { lang, setLang, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

export default I18nContext;
