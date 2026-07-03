import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import PlayerAvatar from '../components/PlayerAvatar';

export default function RapideRoundSummaryScreen({
  roundData,
  onNextRound,
  isHost,
  nextRoundCountdown,
}) {
  const { t } = useI18n();

  if (!roundData) return null;

  const { winnerPseudo, penalties, winnerId } = roundData;

  // Find winner player avatar
  const winnerPlayer = penalties.find(p => p.playerId === winnerId);

  return (
    <div className="screen screen--scores rapide-round-summary" id="rapide-summary-screen">
      {/* WINNER BANNER */}
      <div className="scores__header" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '8px' }}>
          {winnerPlayer && (
            <PlayerAvatar avatarId={winnerPlayer.avatarId} name={winnerPseudo} size="xl" />
          )}
          <span
            className="crown-icon"
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              fontSize: '32px',
              transform: 'rotate(15deg)',
            }}
          >
            👑
          </span>
        </div>
        <h2 className="scores__title" style={{ marginTop: '8px', fontSize: '24px' }}>
          {winnerPseudo}
        </h2>
        <p className="scores__subtitle" style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>
          {t('rapide.roundWinner')}
        </p>
      </div>

      {/* PENALTY SCORES TABLE */}
      <div className="scores__leaderboard" style={{ margin: '0 auto', maxWidth: '340px' }}>
        <h3 className="scores__section-title" style={{ fontSize: '18px', marginBottom: '12px' }}>
          {t('score.leaderboard')}
        </h3>

        <div className="leaderboard__list">
          {penalties
            .sort((a, b) => a.penaltyPts - b.penaltyPts) // show round performance order (lowest penalty first)
            .map((p, idx) => {
              const isWinner = p.playerId === winnerId;
              return (
                <div
                  key={p.playerId}
                  className={`leaderboard__item ${isWinner ? 'leaderboard__item--podium-1' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    margin: '6px 0',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="leaderboard__rank" style={{ fontWeight: 'bold' }}>
                      {idx + 1}
                    </span>
                    <PlayerAvatar avatarId={p.avatarId} name={p.pseudo} size="sm" />
                    <span className="leaderboard__name" style={{ fontWeight: isWinner ? 'bold' : 'normal' }}>
                      {p.pseudo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      className="rapide-summary-cards-badge"
                      style={{
                        fontSize: '12px',
                        background: 'rgba(0,0,0,0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {p.cardsLeft} 🃏
                    </span>
                    <span
                      className="leaderboard__score"
                      style={{
                        fontWeight: 'bold',
                        color: isWinner ? 'var(--color-sage)' : 'var(--color-coral)',
                      }}
                    >
                      +{p.penaltyPts}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* FOOTER ACTIONS / AUTO-COUNTDOWN */}
      <div className="scores__actions" style={{ marginTop: '24px', textAlign: 'center' }}>
        {nextRoundCountdown != null ? (
          <div className="scores__countdown-hint">
            ⏳ {t('score.nextRoundStarting')} ({nextRoundCountdown}s)
          </div>
        ) : (
          <>
            {isHost ? (
              <button
                className="btn btn--primary btn--large btn--full"
                onClick={onNextRound}
                type="button"
                style={{ maxWidth: '340px', margin: '0 auto' }}
              >
                ⏭️ {t('rapide.nextRound')}
              </button>
            ) : (
              <div className="scores__waiting-hint">
                🌱 {t('lobby.waiting')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
