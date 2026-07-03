import React from 'react';
import { AVATARS } from '../avatars';

/**
 * AvatarPicker — horizontal scrollable grid of 12 Ghibli avatars.
 * Props:
 *   selectedId   — currently selected avatar id
 *   onSelect(id) — called when user taps an avatar
 */
export default function AvatarPicker({ selectedId, onSelect }) {
  return (
    <div className="avatar-picker" role="radiogroup" aria-label="Choisir un avatar">
      {AVATARS.map((avatar) => {
        const isSelected = avatar.id === selectedId;
        return (
          <button
            key={avatar.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={avatar.label}
            id={`avatar-btn-${avatar.id}`}
            className={`avatar-picker__item ${isSelected ? 'avatar-picker__item--selected' : ''}`}
            onClick={() => onSelect(avatar.id)}
          >
            <img
              src={avatar.src}
              alt={avatar.label}
              className="avatar-picker__img"
              loading="lazy"
              draggable="false"
            />
            {isSelected && (
              <span className="avatar-picker__check" aria-hidden="true">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
