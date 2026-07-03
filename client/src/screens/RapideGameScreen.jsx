import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket } from '../contexts/SocketContext';
import LetterCard from '../components/LetterCard';
import PlayerAvatar from '../components/PlayerAvatar';

export default function RapideGameScreen({
  roomCode,
  players,
  myPlayerId,
  myCards,
  playerCardsMap,
  theme,
  validCount,
  answersNeeded,
  answerFeed,
  roundNum,
  totalRounds,
  isHost,
  onQuit,
  activeChallenge,
}) {
  const { t } = useI18n();
  const { socket } = useSocket();

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [wordInput, setWordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef(null);

  // Auto-focus input on mount or when theme changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [theme]);

  // Reset selected letter if it's no longer in my cards
  useEffect(() => {
    if (selectedLetter && !myCards.includes(selectedLetter)) {
      setSelectedLetter(null);
    }
  }, [myCards, selectedLetter]);

  const handleCardSelect = useCallback((letter) => {
    setSelectedLetter(letter === selectedLetter ? null : letter);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedLetter]);

  const handleInputChange = (e) => {
    setWordInput(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedLetter) {
      setErrorMessage(t('rapide.error.noCard'));
      return;
    }

    const trimmedWord = wordInput.trim();
    if (!trimmedWord) return;

    // Client-side quick validation: first letter must match card (ignore accents/case)
    const normalizedWord = trimmedWord
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalizedWord.startsWith(selectedLetter)) {
      setErrorMessage(t('rapide.error.wrongLetter'));
      return;
    }

    // Submit via socket
    socket.emit('rapide:submitAnswer', { word: trimmedWord, letter: selectedLetter }, (res) => {
      if (res && res.error) {
        if (res.error === 'duplicate') {
          setErrorMessage(t('rapide.error.duplicate'));
        } else if (res.error === 'no_card') {
          setErrorMessage(t('rapide.error.noCard'));
        } else if (res.error === 'wrong_letter') {
          setErrorMessage(t('rapide.error.wrongLetter'));
        } else {
          setErrorMessage(t('error.generic'));
        }
      } else {
        // Success: Clear input
        setWordInput('');
        setSelectedLetter(null);
      }
    });
  };

  const handleChallenge = (answerId) => {
    socket.emit('rapide:challengeAnswer', { answerId });
  };

  const handleCastVote = (answerId, accept) => {
    socket.emit('rapide:vote', { answerId, accept });
  };

  const handleSkipTheme = () => {
    socket.emit('rapide:skipTheme');
  };

  // Render progress dots
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 0; i < answersNeeded; i++) {
      dots.push(
        <span
          key={i}
          className={`rapide-progress-dot ${i < validCount ? 'rapide-progress-dot--filled' : ''}`}
        />
      );
    }
    return <div className="rapide-progress-dots">{dots}</div>;
  };

  return (
    <div className="screen game game--rapide" id="rapide-game-screen">
      {/* HEADER SECTION */}
      <div className="game__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <button
          onClick={onQuit}
          title={t('lobby.quit')}
          type="button"
          className="btn-exit-icon"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            zIndex: 10,
          }}
        >
          🚪
        </button>
        <span className="game__round" style={{ flexGrow: 1, textAlign: 'center' }}>
          {t('game.round')} {roundNum} {t('game.of')} {totalRounds}
        </span>
        <div style={{ width: '40px' }} /> {/* placeholder for spacing balance */}
      </div>

      {/* PLAYER HANDS OVERVIEW */}
      <div className="rapide-player-hands">
        {players.map((p) => {
          const cardsCount = (playerCardsMap[p.sessionId] || []).length;
          return (
            <div key={p.sessionId} className={`rapide-player-hand ${p.connected ? '' : 'rapide-player-hand--disconnected'}`}>
              <PlayerAvatar avatarId={p.avatarId} name={p.pseudo} size="sm" />
              <span className="rapide-player-hand__count">{cardsCount} 🃏</span>
            </div>
          );
        })}
      </div>

      {/* THEME PILL & PROGRESS */}
      <div className="rapide-theme-area">
        <div className="rapide-theme-pill">
          <span className="rapide-theme-pill__label">{t('rapide.theme')}</span>
          <span className="rapide-theme-pill__text">{t(`category.${theme}`) !== `category.${theme}` ? t(`category.${theme}`) : theme}</span>
        </div>
        {renderProgressDots()}
        <span className="rapide-theme-progress-text">
          {validCount} / {answersNeeded} {t('rapide.validAnswers')}
        </span>
      </div>

      {/* SCROLLABLE ANSWER FEED */}
      <div className="rapide-answer-feed">
        {answerFeed.length === 0 ? (
          <div className="rapide-answer-feed__empty">
            🌱 {t('lobby.waiting')}
          </div>
        ) : (
          answerFeed.map((item) => (
            <div
              key={item.answerId}
              className={`rapide-answer-feed__item rapide-answer-feed__item--${item.status}`}
            >
              <div className="rapide-answer-feed__player">
                <PlayerAvatar avatarId={item.avatarId} name={item.pseudo} size="sm" />
                <span className="rapide-answer-feed__name">{item.pseudo}</span>
              </div>
              <div className="rapide-answer-feed__content">
                <span className="rapide-answer-feed__word">{item.word}</span>
                <span className="rapide-answer-feed__letter-badge">{item.letter}</span>
              </div>
              <div className="rapide-answer-feed__actions">
                {item.status === 'pending' && (
                  <>
                    {item.playerId !== myPlayerId ? (
                      <button
                        className="btn btn--small btn--secondary btn--challenge"
                        onClick={() => handleChallenge(item.answerId)}
                        type="button"
                      >
                        ⚠️ {t('rapide.challenge')}
                      </button>
                    ) : (
                      <span className="rapide-feed-badge rapide-feed-badge--pending">⏳</span>
                    )}
                  </>
                )}
                {item.status === 'accepted' && (
                  <span className="rapide-feed-badge rapide-feed-badge--accepted">✅</span>
                )}
                {item.status === 'rejected' && (
                  <span className="rapide-feed-badge rapide-feed-badge--rejected">❌</span>
                )}
                {item.status === 'challenged' && (
                  <span className="rapide-feed-badge rapide-feed-badge--challenged">⚖️</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MY HAND & INPUT AREA */}
      <div className="rapide-input-area">
        {errorMessage && <div className="rapide-error-toast">{errorMessage}</div>}

        <div className="rapide-my-cards">
          {myCards.map((letter, idx) => (
            <LetterCard
              key={`${letter}_${idx}`}
              letter={letter}
              selected={selectedLetter === letter}
              onSelect={handleCardSelect}
            />
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="rapide-form">
          <input
            ref={inputRef}
            type="text"
            className="rapide-word-input"
            placeholder={selectedLetter ? `${selectedLetter}...` : t('rapide.myCards')}
            value={wordInput}
            onChange={handleInputChange}
            disabled={!selectedLetter}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
          <button
            type="submit"
            className={`btn btn--primary rapide-submit-btn ${
              !selectedLetter || !wordInput.trim() ? 'btn--disabled' : ''
            }`}
            disabled={!selectedLetter || !wordInput.trim()}
          >
            {t('rapide.submit')}
          </button>
        </form>
      </div>

      {/* SKIP THEME (HOST ONLY) */}
      {isHost && (
        <button
          className="btn btn--ghost btn-skip-theme"
          onClick={handleSkipTheme}
          type="button"
        >
          ⏭️ {t('rapide.skipTheme')}
        </button>
      )}

      {/* CHALLENGE VOTING OVERLAY MODAL */}
      {activeChallenge && (
        <div className="qr-overlay rapide-challenge-overlay">
          <div className="qr-modal rapide-challenge-modal">
            <h3 className="qr-modal__title">⚖️ {t('rapide.challengeTitle')}</h3>
            
            <div className="rapide-challenge-info">
              <span className="rapide-challenge-word">{activeChallenge.word}</span>
              <span className="rapide-challenge-letter-badge">{activeChallenge.letter}</span>
            </div>

            <div className="rapide-challenge-tally">
              <span className="tally-accept">✅ {activeChallenge.acceptVotes}</span>
              <span className="tally-separator">/</span>
              <span className="tally-reject">❌ {activeChallenge.rejectVotes}</span>
            </div>

            {activeChallenge.playerId === myPlayerId ? (
              <p className="rapide-challenge-wait-text">{t('vote.waiting')}</p>
            ) : (
              <div className="rapide-challenge-actions">
                <button
                  className="btn btn--primary btn-challenge-vote"
                  onClick={() => handleCastVote(activeChallenge.answerId, true)}
                  type="button"
                >
                  {t('rapide.vote.accept')}
                </button>
                <button
                  className="btn btn--secondary btn-challenge-vote"
                  onClick={() => handleCastVote(activeChallenge.answerId, false)}
                  type="button"
                >
                  {t('rapide.vote.reject')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
