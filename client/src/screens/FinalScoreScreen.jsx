import React, { useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import PlayerAvatar from '../components/PlayerAvatar';

const CONFETTI_COLORS = [
  '#3B82F6', '#ECC94B', '#10B981', '#F56565',
  '#EC4899', '#8B5CF6', '#F97316', '#06B6D4',
];

function ConfettiPieces() {
  const pieces = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`,
      spin: `${360 + Math.random() * 720}deg`,
      size: `${6 + Math.random() * 8}px`,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }));
  }, []);

  return (
    <div className="final-score__confetti">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            backgroundColor: p.color,
            '--fall-duration': p.duration,
            '--fall-delay': p.delay,
            '--spin': p.spin,
          }}
        />
      ))}
    </div>
  );
}

export default function FinalScoreScreen({ leaderboard, onPlayAgain, onNewRoom, isLowestWins }) {
  const { t } = useI18n();

  const podium = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const rest = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.slice(3);
  }, [leaderboard]);

  return (
    <div className="screen final-score" id="final-score-screen">
      <ConfettiPieces />
      
      <div className="final-score__header">
        <h1 className="final-score__title">{t('final.title')}</h1>
        {isLowestWins && (
          <p className="final-score__subtitle" style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            🏆 {t('rapide.lowestWins')}
          </p>
        )}
      </div>

      <div className="final-score__crown">👑</div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="final-score__podium">
          {podium.map((entry, idx) => (
            <div
              key={entry.playerId || idx}
              className={`podium-place podium-place--${idx + 1}`}
            >
              <PlayerAvatar
                avatarId={entry.avatarId}
                name={entry.pseudo}
                size="lg"
                className="podium-place__avatar"
              />
              <div className="podium-place__name">{entry.pseudo}</div>
              <div className="podium-place__score">{entry.totalScore}</div>
              <div className="podium-place__bar">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="leaderboard" style={{ width: '100%', maxWidth: '340px', zIndex: 1 }}>
          <div className="leaderboard__title">{t('final.leaderboard')}</div>
          {rest.map((entry, idx) => (
            <div className="leaderboard__item" key={entry.playerId || idx + 3}>
              <div className="leaderboard__rank leaderboard__rank--other">
                {idx + 4}
              </div>
              <PlayerAvatar avatarId={entry.avatarId} name={entry.pseudo} size="sm" style={{ marginRight: '8px' }} />
              <span className="leaderboard__name">{entry.pseudo}</span>
              <span className="leaderboard__score">{entry.totalScore}</span>
            </div>
          ))}
        </div>
      )}

      <div className="final-score__actions">
        <button
          id="btn-play-again"
          className="btn btn--primary btn--large btn--full"
          onClick={onPlayAgain}
          type="button"
        >
          🔄 {t('final.playAgain')}
        </button>
        <button
          id="btn-new-room"
          className="btn btn--secondary btn--full"
          onClick={onNewRoom}
          type="button"
        >
          🏠 {t('final.newRoom')}
        </button>
      </div>
    </div>
  );
}
