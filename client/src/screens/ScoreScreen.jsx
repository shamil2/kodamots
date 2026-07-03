import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import PlayerAvatar from '../components/PlayerAvatar';

export default function ScoreScreen({ scores, leaderboard, round, onNextRound, isHost, onQuit, nextRoundCountdown }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  // Compute round points, previous scores, and handle animations + re-sorting
  useEffect(() => {
    if (!leaderboard) return;

    // 1. Calculate points earned in this round for each player (category scores + speed bonus)
    const roundPointsMap = {};
    for (const player of leaderboard) {
      roundPointsMap[player.pseudo] = 0;
    }

    if (scores && scores.categories) {
      for (const cat of scores.categories) {
        for (const entry of cat.entries) {
          const pseudo = entry.pseudo;
          if (pseudo in roundPointsMap) {
            roundPointsMap[pseudo] += entry.points || 0;
          }
        }
      }
    }
    if (scores && scores.speedBonus && scores.speedBonus.pseudo) {
      const sp = scores.speedBonus.pseudo;
      if (sp in roundPointsMap) {
        roundPointsMap[sp] += scores.speedBonus.points || 0;
      }
    }

    // 2. Create list items with previous scores
    const initialItems = leaderboard.map((player) => {
      const earned = roundPointsMap[player.pseudo] || 0;
      const prevScore = player.totalScore - earned;
      return {
        playerId: player.playerId,
        pseudo: player.pseudo,
        prevScore,
        newScore: player.totalScore,
        earned,
        displayScore: prevScore,
        showAdded: false,
        displayIndex: 0,
      };
    });

    // 3. Sort by prevScore to show the old classification first
    initialItems.sort((a, b) => b.prevScore - a.prevScore);
    initialItems.forEach((item, idx) => {
      item.displayIndex = idx;
    });

    setItems(initialItems);

    // 4. SUSPENSE TIMERS:
    // Timer 1: Count up scores and pop the points added (+X)
    const countUpTimer = setTimeout(() => {
      setItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          displayScore: item.newScore,
          showAdded: true,
        }))
      );
    }, 1500);

    // Timer 2: Smoothly swap ranks to reflect the new classification
    const sortTimer = setTimeout(() => {
      setItems((prevItems) => {
        const sortedOrder = [...prevItems].sort((a, b) => b.newScore - a.newScore);
        return prevItems.map((item) => {
          const newIndex = sortedOrder.findIndex((x) => x.playerId === item.playerId);
          return {
            ...item,
            displayIndex: newIndex,
          };
        });
      });
    }, 3200);

    return () => {
      clearTimeout(countUpTimer);
      clearTimeout(sortTimer);
    };
  }, [leaderboard, scores]);

  const podiumItems = useMemo(() => {
    const filtered = items.filter(item => item.displayIndex < 3);
    const sorted = new Array(Math.min(filtered.length, 3));
    filtered.forEach(item => {
      sorted[item.displayIndex] = item;
    });
    return sorted.filter(Boolean);
  }, [items]);

  const restItems = useMemo(() => {
    return items.filter(item => item.displayIndex >= 3).sort((a, b) => a.displayIndex - b.displayIndex);
  }, [items]);

  return (
    <div className="screen score" id="score-screen" style={{ position: 'relative' }}>
      <div className="score__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
        <h1 className="score__round-title" style={{ flexGrow: 1, textAlign: 'center' }}>
          {t('score.roundTitle')} {round}
        </h1>
      </div>

      {/* Category-by-category results */}
      {scores && scores.categories && (
        <div className="score__categories">
          {scores.categories.map((cat, catIdx) => (
            <div className="score__category" key={cat.name} style={{ animationDelay: `${catIdx * 0.05}s` }}>
              <div className="score__category-name">{cat.name}</div>
              <div className="score__category-entries">
                {(cat.entries || []).map((entry, eIdx) => (
                  <div className="score__entry" key={eIdx}>
                    <span className="score__entry-player">{entry.pseudo}</span>
                    <span className={`score__entry-word ${
                      !entry.answer ? 'score__word--empty' :
                      entry.valid === false ? 'score__word--invalid' :
                      'score__word--valid'
                    }`}>
                      {entry.answer || t('score.emptyAnswer')}
                    </span>
                    <span className="score__entry-points text-blue">
                      {entry.points != null ? `${entry.points} ${t('score.points')}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speed bonus */}
      {scores && scores.speedBonus && (
        <div className="score__speed-bonus">
          ⚡ {t('score.speedBonus')}{scores.speedBonus.points} — {scores.speedBonus.pseudo}
        </div>
      )}

      <div className="divider" />

      {/* Leaderboard with Podium + Rest */}
      {items.length > 0 && (
        <div className="leaderboard" style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
          <div className="leaderboard__title">{t('score.leaderboard')}</div>

          {/* Podium for Top 3 */}
          {podiumItems.length > 0 && (
            <div className="score__podium">
              {podiumItems.map((item) => {
                const idx = item.displayIndex;
                return (
                  <div
                    key={item.playerId}
                    className={`podium-place podium-place--${idx + 1}`}
                    style={{ transition: 'transform 0.5s ease' }}
                  >
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <PlayerAvatar
                        avatarId={item.avatarId}
                        name={item.pseudo}
                        size="lg"
                        className="podium-place__avatar"
                      />
                      {item.showAdded && item.earned > 0 && (
                        <span
                          className="animate-bounce"
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-16px',
                            background: 'var(--color-success)',
                            color: '#fff',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            zIndex: 10,
                          }}
                        >
                          +{item.earned}
                        </span>
                      )}
                    </div>
                    <div className="podium-place__name">{item.pseudo}</div>
                    <div className="podium-place__score">{item.displayScore}</div>
                    <div className="podium-place__bar">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of the players list */}
          {restItems.length > 0 && (
            <div
              className="leaderboard__list"
              style={{
                position: 'relative',
                height: `${restItems.length * 68}px`,
                transition: 'height 0.3s ease',
                width: '100%',
              }}
            >
              {restItems.map((item) => {
                const maxScore = Math.max(...items.map((it) => it.newScore), 1);
                const barPercent = Math.min((item.displayScore / maxScore) * 100, 100);
                const relativeIndex = item.displayIndex - 3;

                return (
                  <div
                    className="leaderboard__item"
                    key={item.playerId}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      height: '60px',
                      transform: `translateY(${relativeIndex * 68}px)`,
                      transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s, border-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 var(--space-lg)',
                      overflow: 'hidden',
                      zIndex: relativeIndex === 0 ? 5 : 1,
                    }}
                  >
                    {/* Progress bar overlay background */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${barPercent}%`,
                        background: 'rgba(56, 189, 248, 0.08)',
                        transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />

                    {/* Rank Badge */}
                    <div
                      className="leaderboard__rank leaderboard__rank--other"
                      style={{ zIndex: 1, transition: 'background 0.5s ease, color 0.5s ease' }}
                    >
                      {item.displayIndex + 1}
                    </div>

                    {/* Pseudo and point pop indicator */}
                    <span className="leaderboard__name" style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.pseudo}
                      {item.showAdded && item.earned > 0 && (
                        <span
                          className="animate-bounce"
                          style={{
                            background: 'var(--color-success)',
                            color: '#fff',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            animationDuration: '1s',
                          }}
                        >
                          +{item.earned}
                        </span>
                      )}
                    </span>

                    {/* Score */}
                    <span className="leaderboard__score" style={{ zIndex: 1 }}>
                      {item.displayScore}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isHost && (
        <div className="score__actions">
          <button
            id="btn-next-round"
            className={`btn btn--primary btn--large btn--full ${nextRoundCountdown != null ? 'btn--disabled' : ''}`}
            onClick={onNextRound}
            type="button"
            disabled={nextRoundCountdown != null}
          >
            ➡️ {t('score.nextRound')}
          </button>
        </div>
      )}

      {nextRoundCountdown != null && (
        <div className="countdown-overlay" id="next-round-countdown-overlay" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 100 }}>
          <div className="countdown-overlay__number animate-bounce" key={nextRoundCountdown} style={{ fontSize: '100px', color: 'var(--color-neon-yellow)' }}>
            {nextRoundCountdown}
          </div>
          <div className="countdown-overlay__label" style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
            {t('score.nextRoundStarting')}
          </div>
        </div>
      )}
    </div>
  );
}
