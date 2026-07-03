import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function OrientationWarning() {
  const { t } = useI18n();

  return (
    <div className="orientation-warning" id="orientation-warning">
      <div className="orientation-warning__icon">
        📱
      </div>
      <p className="orientation-warning__text">
        {t('orientation.text')}
      </p>
    </div>
  );
}
