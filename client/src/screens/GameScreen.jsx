import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket } from '../contexts/SocketContext';
import LetterRoulette from '../components/LetterRoulette';
import SpeedButton from '../components/SpeedButton';
import CountdownOverlay from '../components/CountdownOverlay';

export default function GameScreen({
  roomCode,
  letter,
  categories,
  round,
  totalRounds,
  gamePhase,
  countdownSeconds,
  countdownTriggeredBy,
  onPhaseChange,
  onQuit,
}) {
  const { t } = useI18n();
  const { socket } = useSocket();

  const [answers, setAnswers] = useState({});
  const [allFilled, setAllFilled] = useState(false);
  const [locked, setLocked] = useState(false);
  const inputsRef = useRef({});

  // Reset answers when new round starts
  useEffect(() => {
    if (gamePhase === 'LETTER_SPIN' || gamePhase === 'INPUT') {
      setAnswers({});
      setAllFilled(false);
      setLocked(false);
    }
  }, [gamePhase, round]);

  // Check if all fields are filled
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    const filled = categories.every((cat) => (answers[cat] || '').trim().length > 0);
    setAllFilled(filled);
  }, [answers, categories]);

  // Listen for inputs locked
  useEffect(() => {
    if (!socket) return;

    const handleLocked = () => {
      setLocked(true);
      // Submit answers on lock
      socket.emit('game:submitAnswers', {
        roomCode,
        answers: { ...answers },
      });
    };

    socket.on('game:inputsLocked', handleLocked);
    return () => {
      socket.off('game:inputsLocked', handleLocked);
    };
  }, [socket, roomCode, answers]);

  const handleInputChange = useCallback((category, value) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [category]: value }));
  }, [locked]);

  const handleSpeedPress = useCallback(() => {
    if (locked) return;
    // Submit answers immediately
    socket.emit('game:submitAnswers', {
      roomCode,
      answers: { ...answers },
    });
    socket.emit('game:speedPressed', { roomCode });
  }, [socket, roomCode, answers, locked]);

  const handleLetterRevealed = useCallback(() => {
    if (onPhaseChange) onPhaseChange('INPUT');
  }, [onPhaseChange]);

  // LETTER_SPIN phase
  if (gamePhase === 'LETTER_SPIN') {
    return (
      <div className="screen screen--center" id="game-screen-spin">
        <button
          onClick={onQuit}
          title="Quit"
          type="button"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
        >
          🚪
        </button>
        <div className="game__round">
          {t('game.round')} {round} {t('game.of')} {totalRounds}
        </div>
        <LetterRoulette letter={letter} onComplete={handleLetterRevealed} />
      </div>
    );
  }

  // INPUT phase (and COUNTDOWN is overlaid)
  return (
    <div className="screen game" id="game-screen-input">
      <div className="game__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <button
          onClick={onQuit}
          title="Quit"
          type="button"
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
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
        >
          🚪
        </button>
        <span className="game__round" style={{ flexGrow: 1, textAlign: 'center' }}>
          {t('game.round')} {round} {t('game.of')} {totalRounds}
        </span>
        <div className="game__letter-badge">{letter?.toUpperCase()}</div>
      </div>

      <div className="game__inputs">
        {(categories || []).map((cat, idx) => (
          <div className="game__input-group" key={cat} style={{ animationDelay: `${idx * 0.05}s` }}>
            <label className="game__input-label" htmlFor={`game-input-${idx}`}>
              {t(`category.${cat}`) !== `category.${cat}` ? t(`category.${cat}`) : cat}
            </label>
            <input
              id={`game-input-${idx}`}
              ref={(el) => { inputsRef.current[cat] = el; }}
              className={`game__input ${(answers[cat] || '').trim() ? 'game__input--filled' : ''}`}
              type="text"
              value={answers[cat] || ''}
              onChange={(e) => handleInputChange(cat, e.target.value)}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              autoComplete="off"
              disabled={locked}
              placeholder={`${letter?.toUpperCase()}...`}
            />
          </div>
        ))}
      </div>

      {!locked && (
        <div className="game__speed-area">
          <SpeedButton
            active={allFilled}
            onPress={handleSpeedPress}
            label={t('game.speed')}
          />
        </div>
      )}

      {gamePhase === 'COUNTDOWN' && countdownSeconds != null && (
        <CountdownOverlay
          seconds={countdownSeconds}
          triggeredBy={countdownTriggeredBy}
        />
      )}

      {locked && (
        <div className="countdown-overlay" id="game-locked-overlay">
          <div className="countdown-overlay__number" style={{ fontSize: '48px' }}>✓</div>
          <div className="countdown-overlay__label">{t('game.locked')}</div>
        </div>
      )}
    </div>
  );
}
