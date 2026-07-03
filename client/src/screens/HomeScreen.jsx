import React, { useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import LanguageToggle from '../components/LanguageToggle';

const FLOATING_LETTERS = 'SPEEDBACMOBILE'.split('');

function FloatingLetters() {
  const letters = useMemo(() => {
    return FLOATING_LETTERS.map((char, i) => ({
      char,
      left: `${(i * 7.5 + Math.random() * 5) % 100}%`,
      duration: `${12 + Math.random() * 10}s`,
      delay: `${Math.random() * 10}s`,
      size: `${1.2 + Math.random() * 1.8}rem`,
    }));
  }, []);

  return (
    <div className="home__bg">
      {letters.map((l, i) => (
        <span
          key={i}
          className="home__floating-letter"
          style={{
            left: l.left,
            fontSize: l.size,
            '--duration': l.duration,
            '--delay': l.delay,
          }}
        >
          {l.char}
        </span>
      ))}
    </div>
  );
}

import { soundManager } from '../utils/sounds';

export default function HomeScreen({ onCreateRoom, onJoinRoom }) {
  const { t } = useI18n();

  const handleCreate = () => {
    soundManager.play('click');
    onCreateRoom();
  };

  const handleJoin = () => {
    soundManager.play('click');
    onJoinRoom();
  };

  return (
    <div className="screen home" id="home-screen">
      <FloatingLetters />

      <div className="home__lang-corner">
        <LanguageToggle />
      </div>

      <div className="home__content">
        <div className="home__logo">
          <h1 className="home__title">{t('app.title')}</h1>
          <p className="home__subtitle">{t('app.subtitle')}</p>
        </div>

        <div className="home__actions">
          <button
            id="btn-create-room"
            className="btn btn--primary btn--large btn--full"
            onClick={handleCreate}
            type="button"
          >
            🎮 {t('home.createRoom')}
          </button>
          <button
            id="btn-join-room"
            className="btn btn--secondary btn--large btn--full"
            onClick={handleJoin}
            type="button"
          >
            🚀 {t('home.joinRoom')}
          </button>
        </div>
      </div>
    </div>
  );
}
