import React from 'react';
import { getAvatarSrc } from '../avatars';

/**
 * PlayerAvatar — renders a player's Ghibli avatar image (or initials fallback).
 *
 * Props:
 *   avatarId  — the avatar id string (e.g. 'fox')
 *   name      — player display name (used for alt text and fallback initials)
 *   size      — 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   className — extra CSS classes
 */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PlayerAvatar({ avatarId, name, size = 'md', className = '', style = {} }) {
  const src = getAvatarSrc(avatarId);

  const sizeClass = `player-avatar--${size}`;

  if (src) {
    return (
      <div className={`player-avatar ${sizeClass} ${className}`} style={style}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="player-avatar__img"
          draggable="false"
        />
      </div>
    );
  }

  // Fallback: colored circle with initials
  return (
    <div className={`player-avatar player-avatar--fallback ${sizeClass} ${className}`} style={style}>
      {getInitials(name)}
    </div>
  );
}
