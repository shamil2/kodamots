import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="lang-toggle" id="language-toggle">
      <div
        className="lang-toggle__slider"
        style={lang === 'en' ? { transform: 'translateX(100%)' } : {}}
      />
      <button
        id="lang-toggle-fr"
        className={`lang-toggle__option ${lang === 'fr' ? 'lang-toggle__option--active' : ''}`}
        onClick={() => setLang('fr')}
        type="button"
        aria-label="Français"
      >
        🇫🇷 FR
      </button>
      <button
        id="lang-toggle-en"
        className={`lang-toggle__option ${lang === 'en' ? 'lang-toggle__option--active' : ''}`}
        onClick={() => setLang('en')}
        type="button"
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
