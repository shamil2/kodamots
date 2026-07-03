import React, { useState, useCallback } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket } from '../contexts/SocketContext';
import PlayerList from '../components/PlayerList';

export default function LobbyScreen({ roomCode, players, config, isHost, onQuit }) {
  const { t } = useI18n();
  const { socket } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const canStart = isHost && players.length >= 2;

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }, [roomCode]);

  const handleShare = useCallback(async () => {
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
    } catch {
      // User cancelled
    }
  }, [roomCode, t]);

  const handleStart = useCallback(() => {
    socket.emit('game:start', { roomCode });
  }, [socket, roomCode]);

  const langLabel = config?.language === 'fr'
    ? t('lobby.langFr')
    : config?.language === 'en'
    ? t('lobby.langEn')
    : t('lobby.langMixed');

  return (
    <div className="screen lobby" id="lobby-screen">
      <div className="lobby__header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
          <div
            className="lobby__room-code"
            onClick={handleCopyCode}
            role="button"
            tabIndex={0}
            id="lobby-room-code"
            style={{ margin: 0 }}
          >
            <span className="lobby__room-code-text">{roomCode}</span>
            <span className="lobby__room-code-copy">📋</span>
          </div>

          <button
            onClick={() => setShowQR(true)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              height: '48px',
            }}
            title="Scan QR Code to Join"
            type="button"
          >
            📷
          </button>
        </div>

        {copied && <div className="lobby__copied">{t('lobby.copied')}</div>}

        <h2 className="lobby__title">{t('lobby.title')}</h2>

        {config && (
          <div className="lobby__config">
            <span className="lobby__config-tag lobby__config-tag--mode">
              {config.gameMode === 'rapide' ? t('home.modeRapide') : t('home.modePetitBac')}
            </span>
            <span className="lobby__config-tag">{langLabel}</span>
            <span className="lobby__config-tag">
              {config.rounds} {t('lobby.roundsLabel')}
            </span>
            {config.gameMode === 'rapide' ? (
              <>
                <span className="lobby__config-tag">
                  {config.cardsPerPlayer} 🃏
                </span>
                <span className="lobby__config-tag">
                  {config.scoreLimit} 🛑
                </span>
              </>
            ) : (
              <span className="lobby__config-tag">
                {config.categories?.length || 0} {t('lobby.categoriesLabel')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="lobby__players">
        <div className="lobby__players-title">
          {t('lobby.players')} ({players.length})
        </div>
        <PlayerList
          players={players}
          hostId={players.length > 0 ? (players[0].id || players[0].socketId) : null}
        />
      </div>

      <div className="lobby__actions">
        <button
          id="btn-lobby-quit"
          className="btn btn--ghost btn--full"
          onClick={onQuit}
          type="button"
          style={{ marginBottom: '8px' }}
        >
          🚪 {t('lobby.quit') || 'Quitter'}
        </button>

        <button
          id="btn-lobby-share"
          className="btn btn--secondary btn--full"
          onClick={handleShare}
          type="button"
        >
          📤 {t('lobby.share')}
        </button>

        {isHost && (
          <button
            id="btn-lobby-start"
            className={`btn btn--primary btn--large btn--full ${!canStart ? 'btn--disabled' : ''}`}
            onClick={handleStart}
            type="button"
            disabled={!canStart}
          >
            🚀 {canStart ? t('lobby.start') : t('lobby.needMore')}
          </button>
        )}
      </div>

      {/* QR Code Popin Overlay */}
      {showQR && (
        <div className="qr-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="qr-modal__title">{t('lobby.scanToJoin')}</h3>
            
            <div className="qr-modal__code-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}/?room=${roomCode}`
                )}`}
                alt={`QR Code to join room ${roomCode}`}
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>
            
            <div className="qr-modal__code-text">{roomCode}</div>

            <button
              onClick={() => setShowQR(false)}
              className="btn btn--secondary btn--full"
              style={{ padding: '8px 16px', height: '38px', fontSize: '14px' }}
              type="button"
            >
              {t('lobby.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
