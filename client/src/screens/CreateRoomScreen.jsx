import React, { useState, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket, safeLocalStorage } from '../contexts/SocketContext';
import AvatarPicker from '../components/AvatarPicker';
import { DEFAULT_AVATAR_ID } from '../avatars';

const DEFAULT_CATEGORIES = [
  'Prénom', 'Animal', 'Pays / Ville', 'Métier',
  'Fruit / Légume', 'Objet', 'Marque', 'Célébrité',
  'Sport', 'Film / Série',
];

const INITIALLY_SELECTED = [
  'Prénom', 'Animal', 'Pays / Ville', 'Métier',
  'Fruit / Légume', 'Objet',
];

export default function CreateRoomScreen({ onBack, onRoomCreated }) {
  const { t } = useI18n();
  const { socket } = useSocket();

  const [pseudo, setPseudo] = useState(() => safeLocalStorage.getItem('speedbac_username') || '');
  const [avatarId, setAvatarId] = useState(() => safeLocalStorage.getItem('speedbac_avatar') || DEFAULT_AVATAR_ID);
  const [gameMode, setGameMode] = useState('petit_bac');
  const [gameLang, setGameLang] = useState('fr');
  const [categories, setCategories] = useState(new Set(INITIALLY_SELECTED));
  const [rounds, setRounds] = useState(3);
  const [excludeRareLetters, setExcludeRareLetters] = useState(true);
  
  // Rapide-specific settings
  const [cardsPerPlayer, setCardsPerPlayer] = useState(5);
  const [answersPerTheme, setAnswersPerTheme] = useState(3);
  const [scoreLimit, setScoreLimit] = useState(40);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleCategory = useCallback((cat) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    const trimmedPseudo = pseudo.trim();
    if (!trimmedPseudo) {
      setError(t('create.error.pseudo'));
      return;
    }
    if (gameMode === 'petit_bac' && categories.size < 3) {
      setError(t('create.error.categories'));
      return;
    }

    // Save username and avatar persistently
    safeLocalStorage.setItem('speedbac_username', trimmedPseudo);
    safeLocalStorage.setItem('speedbac_avatar', avatarId);

    setError('');
    setLoading(true);

    const config = {
      gameMode,
      language: gameLang,
      rounds,
      excludeRareLetters,
    };

    if (gameMode === 'petit_bac') {
      config.categories = Array.from(categories);
    } else {
      config.cardsPerPlayer = cardsPerPlayer;
      config.answersPerTheme = answersPerTheme;
      config.scoreLimit = scoreLimit;
    }

    socket.emit('room:create', {
      pseudo: trimmedPseudo,
      avatarId,
      config,
    });
  }, [pseudo, avatarId, gameMode, gameLang, categories, rounds, excludeRareLetters, cardsPerPlayer, answersPerTheme, scoreLimit, socket, t]);

  const handleShare = useCallback(async (roomCode) => {
    const url = `${window.location.origin}?room=${roomCode}`;
    const shareData = {
      title: t('create.shareTitle'),
      text: `${t('create.shareText')} ${roomCode}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {
        // Silently fail
      }
    }
  }, [t]);

  // Attach room:created listener in parent (App.jsx). This screen just emits.

  const langOptions = [
    { value: 'fr', emoji: '🇫🇷', label: t('create.langFr') },
    { value: 'en', emoji: '🇬🇧', label: t('create.langEn') },
    { value: 'mixed', emoji: '🌍', label: t('create.langMixed') },
  ];

  return (
    <div className="screen create-room" id="create-room-screen">
      <div className="create-room__header">
        <button
          id="btn-create-back"
          className="create-room__back"
          onClick={onBack}
          type="button"
          aria-label={t('join.back')}
        >
          ←
        </button>
        <h1 className="create-room__title">{t('create.title')}</h1>
      </div>

      <div className="create-room__scroll">
        {/* Avatar selection */}
        <div className="create-room__section">
          <div className="create-room__section-title">🐾 {t('create.avatar') || 'Ton personnage'}</div>
          <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
        </div>

        {/* Game Mode */}
        <div className="create-room__section">
          <div className="create-room__section-title">{t('create.gameMode')}</div>
          <div className="lang-cards">
            <button
              id="mode-card-petit-bac"
              className={`lang-card ${gameMode === 'petit_bac' ? 'lang-card--selected' : ''}`}
              onClick={() => setGameMode('petit_bac')}
              type="button"
              style={{ width: '48%' }}
            >
              <span className="lang-card__emoji">📝</span>
              <span className="lang-card__label">{t('create.modePetitBac')}</span>
            </button>
            <button
              id="mode-card-rapide"
              className={`lang-card ${gameMode === 'rapide' ? 'lang-card--selected' : ''}`}
              onClick={() => setGameMode('rapide')}
              type="button"
              style={{ width: '48%' }}
            >
              <span className="lang-card__emoji">⚡</span>
              <span className="lang-card__label">{t('create.modeRapide')}</span>
            </button>
          </div>
        </div>

        {/* Pseudonym */}
        <div className="create-room__section">
          <label className="create-room__section-title" htmlFor="create-pseudo-input">
            {t('create.pseudo')}
          </label>
          <input
            id="create-pseudo-input"
            className="input"
            type="text"
            placeholder={t('create.pseudoPlaceholder')}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            autoComplete="off"
          />
        </div>

        {/* Game Language */}
        <div className="create-room__section">
          <div className="create-room__section-title">{t('create.gameLang')}</div>
          <div className="lang-cards">
            {langOptions.map((opt) => (
              <button
                key={opt.value}
                id={`lang-card-${opt.value}`}
                className={`lang-card ${gameLang === opt.value ? 'lang-card--selected' : ''}`}
                onClick={() => setGameLang(opt.value)}
                type="button"
              >
                <span className="lang-card__emoji">{opt.emoji}</span>
                <span className="lang-card__label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONDITION 1: Petit Bac (Categories) */}
        {gameMode === 'petit_bac' && (
          <div className="create-room__section">
            <div className="create-room__section-title">
              {t('create.categories')} ({categories.size})
            </div>
            <div className="category-list">
              {DEFAULT_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  id={`category-toggle-${cat.replace(/\s+/g, '-')}`}
                  className="category-toggle"
                  onClick={() => toggleCategory(cat)}
                  role="switch"
                  aria-checked={categories.has(cat)}
                  tabIndex={0}
                >
                  <span className="category-toggle__label">
                    {t(`category.${cat}`) !== `category.${cat}` ? t(`category.${cat}`) : cat}
                  </span>
                  <div className={`category-toggle__switch ${categories.has(cat) ? 'category-toggle__switch--on' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONDITION 2: Rapide Steppers */}
        {gameMode === 'rapide' && (
          <>
            {/* Cards Per Player */}
            <div className="create-room__section">
              <div className="create-room__section-title">{t('create.cardsPerPlayer')}</div>
              <div className="stepper">
                <button
                  id="stepper-cards-minus"
                  className={`stepper__btn ${cardsPerPlayer <= 3 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setCardsPerPlayer((v) => Math.max(3, v - 1))}
                  type="button"
                >
                  −
                </button>
                <span className="stepper__value">{cardsPerPlayer}</span>
                <button
                  id="stepper-cards-plus"
                  className={`stepper__btn ${cardsPerPlayer >= 7 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setCardsPerPlayer((v) => Math.min(7, v + 1))}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            {/* Answers Per Theme */}
            <div className="create-room__section">
              <div className="create-room__section-title">{t('create.answersPerTheme')}</div>
              <div className="stepper">
                <button
                  id="stepper-answers-minus"
                  className={`stepper__btn ${answersPerTheme <= 2 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setAnswersPerTheme((v) => Math.max(2, v - 1))}
                  type="button"
                >
                  −
                </button>
                <span className="stepper__value">{answersPerTheme}</span>
                <button
                  id="stepper-answers-plus"
                  className={`stepper__btn ${answersPerTheme >= 5 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setAnswersPerTheme((v) => Math.min(5, v + 1))}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            {/* Score Limit */}
            <div className="create-room__section">
              <div className="create-room__section-title">
                {t('create.scoreLimit')}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 'normal', marginTop: '2px' }}>
                  {t('create.scoreLimitHint')}
                </span>
              </div>
              <div className="stepper">
                <button
                  id="stepper-limit-minus"
                  className={`stepper__btn ${scoreLimit <= 10 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setScoreLimit((v) => Math.max(10, v - 5))}
                  type="button"
                >
                  −
                </button>
                <span className="stepper__value">{scoreLimit}</span>
                <button
                  id="stepper-limit-plus"
                  className={`stepper__btn ${scoreLimit >= 100 ? 'stepper__btn--disabled' : ''}`}
                  onClick={() => setScoreLimit((v) => Math.min(100, v + 5))}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}

        {/* Rounds */}
        <div className="create-room__section">
          <div className="create-room__section-title">{t('create.rounds')}</div>
          <div className="stepper">
            <button
              id="stepper-minus"
              className={`stepper__btn ${rounds <= 1 ? 'stepper__btn--disabled' : ''}`}
              onClick={() => setRounds((r) => Math.max(1, r - 1))}
              type="button"
              aria-label="Decrease rounds"
            >
              −
            </button>
            <span className="stepper__value">{rounds}</span>
            <button
              id="stepper-plus"
              className={`stepper__btn ${rounds >= 10 ? 'stepper__btn--disabled' : ''}`}
              onClick={() => setRounds((r) => Math.min(10, r + 1))}
              type="button"
              aria-label="Increase rounds"
            >
              +
            </button>
          </div>
        </div>

        {/* Rare Letters */}
        <div className="create-room__section">
          <div
            id="rare-letters-toggle"
            className="category-toggle"
            onClick={() => setExcludeRareLetters((v) => !v)}
            role="switch"
            aria-checked={!excludeRareLetters}
            tabIndex={0}
          >
            <div>
              <span className="category-toggle__label">{t('create.rareLetters')}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {t('create.rareLettersHint')}
              </div>
            </div>
            <div className={`category-toggle__switch ${!excludeRareLetters ? 'category-toggle__switch--on' : ''}`} />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>

      {copied && <div className="toast">{t('create.copied')}</div>}

      <div className="create-room__cta">
        <button
          id="btn-create-submit"
          className={`btn btn--primary btn--large btn--full ${loading ? 'btn--disabled' : ''}`}
          onClick={handleCreate}
          type="button"
          disabled={loading}
        >
          {loading ? '...' : `🎲 ${t('create.generateLink')}`}
        </button>
      </div>
    </div>
  );
}
