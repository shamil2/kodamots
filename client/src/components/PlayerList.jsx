import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import PlayerAvatar from './PlayerAvatar';

export default function PlayerList({ players = [], hostId }) {
  const { t } = useI18n();

  if (!players.length) {
    return (
      <div className="player-list">
        <div className="text-secondary text-center" style={{ padding: '20px 0' }}>
          {t('lobby.waiting')}
        </div>
      </div>
    );
  }

  return (
    <div className="player-list" id="player-list">
      {players.map((player, idx) => (
        <div
          className="player-item"
          key={player.id || player.socketId || idx}
          id={`player-item-${idx}`}
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <PlayerAvatar
            avatarId={player.avatarId}
            name={player.pseudo || player.name}
            size="sm"
            className="player-item__avatar"
          />
          <div className="player-item__info">
            <div className="player-item__name">
              {player.pseudo || player.name}
            </div>
            {(player.id === hostId || player.socketId === hostId || player.isHost) && (
              <div className="player-item__badge">
                {t('lobby.host')}
              </div>
            )}
          </div>
          <div
            className={`player-item__status ${
              player.connected === false ? 'player-item__status--offline' : ''
            }`}
          />
        </div>
      ))}
    </div>
  );
}
