import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export default function DesktopBlockScreen() {
  const { t } = useI18n();

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=0F172A&margin=8`;

  return (
    <div className="screen screen--center desktop-block" id="desktop-block-screen">
      <div className="desktop-block__icon">📱</div>
      <h1 className="desktop-block__title">{t('desktop.title')}</h1>
      <p className="desktop-block__text">{t('desktop.text')}</p>
      <div className="desktop-block__qr">
        <img
          src={qrUrl}
          alt="QR Code"
          width="180"
          height="180"
          loading="eager"
        />
      </div>
      <p className="text-secondary">{t('desktop.scanText')}</p>
    </div>
  );
}
