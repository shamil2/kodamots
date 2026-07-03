import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function CountdownOverlay({ seconds, triggeredBy }) {
  const { t } = useI18n();

  return (
    <div className="countdown-overlay" id="countdown-overlay">
      <div className="countdown-overlay__trigger">
        ⚡ {t('game.countdownTriggered')} {triggeredBy}
      </div>
      <div className="countdown-overlay__number" key={seconds}>
        {seconds}
      </div>
      <div className="countdown-overlay__label">
        {t('game.countdown')}
      </div>
    </div>
  );
}
