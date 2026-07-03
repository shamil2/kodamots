import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket } from '../contexts/SocketContext';
import SwipeCard from '../components/SwipeCard';

export default function VoteScreen({ roomCode, votingData, myPlayerId, myPseudo, onQuit }) {
  const { t } = useI18n();
  const { socket } = useSocket();

  // Filter out own answers (using both sessionId and pseudo as a double-safety fallback)
  const filteredData = useMemo(() => {
    if (!votingData) return [];
    const cleanPlayerId = (myPlayerId || '').trim();
    const cleanPseudo = (myPseudo || '').toLowerCase().trim();

    return votingData.filter((item) => {
      const itemPlayerId = (item.playerId || '').trim();
      const itemPseudo = (item.pseudo || '').toLowerCase().trim();

      // If the card matches either our session ID or our nickname, it is ours
      const isOurs = (cleanPlayerId && itemPlayerId === cleanPlayerId) ||
                     (cleanPseudo && itemPseudo === cleanPseudo);

      return !isOurs;
    });
  }, [votingData, myPlayerId, myPseudo]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentItem = filteredData[currentIndex] || null;
  const total = filteredData.length;
  const isDone = currentIndex >= total;

  useEffect(() => {
    if (total === 0 || currentIndex >= total) {
      socket.emit('vote:finish', { roomCode });
    }
  }, [currentIndex, total, socket, roomCode]);

  const handleVote = useCallback((valid) => {
    if (!currentItem) return;
    socket.emit('vote:cast', {
      roomCode,
      answerId: currentItem.id,
      valid,
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentItem, socket, roomCode]);

  if (isDone || total === 0) {
    return (
      <div className="screen screen--center vote" id="vote-screen-done" style={{ position: 'relative' }}>
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
        <div className="vote__header">
          <h1 className="vote__title">{t('vote.title')}</h1>
          <p className="text-secondary" style={{ marginTop: '8px' }}>{t('vote.waiting')}</p>
        </div>
        <div style={{ fontSize: '48px', animation: 'bounceIn 0.5s ease' }}>⏳</div>
      </div>
    );
  }

  return (
    <div className="screen screen--center vote" id="vote-screen" style={{ position: 'relative' }}>
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
      <div className="vote__header">
        <h1 className="vote__title" style={{ marginTop: '12px' }}>{t('vote.title')}</h1>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          {currentIndex + 1} {t('vote.progress')} {total}
        </p>
        <div className="vote__progress">
          {filteredData.map((_, i) => (
            <div
              key={i}
              className={`vote__progress-dot ${
                i < currentIndex
                  ? 'vote__progress-dot--done'
                  : i === currentIndex
                  ? 'vote__progress-dot--current'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="vote__card-area">
        <SwipeCard
          key={currentItem.id}
          id={`vote-card-${currentIndex}`}
          onSwipeRight={() => handleVote(true)}
          onSwipeLeft={() => handleVote(false)}
        >
          <div className="vote__card-category">{currentItem.category}</div>
          <div className="vote__card-word" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2C3E50' }}>
            "{currentItem.answer || '—'}"
          </div>
          <div className="vote__card-player" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            ✍️ {currentItem.pseudo}
          </div>
        </SwipeCard>
      </div>

      <div className="vote__buttons">
        <button
          onClick={() => handleVote(false)}
          className="vote-btn vote-btn--no"
          title="Reject"
          type="button"
        >
          ❌
        </button>
        <button
          onClick={() => handleVote(true)}
          className="vote-btn vote-btn--yes"
          title="Accept"
          type="button"
        >
          ✅
        </button>
      </div>

      <p className="vote__hint" style={{ marginTop: '8px' }}>{t('vote.swipeRight')}</p>
    </div>
  );
}
