import React, { useCallback } from 'react';

export default function SpeedButton({ active, onPress, label = 'SPEED' }) {
  const handleClick = useCallback((e) => {
    if (!active) return;
    // Set ripple position
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--ripple-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty('--ripple-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    if (onPress) onPress();
  }, [active, onPress]);

  if (!active) return null;

  return (
    <div className="speed-btn-wrapper">
      <button
        id="speed-button"
        className="speed-btn"
        onClick={handleClick}
        type="button"
        aria-label={label}
      >
        {label}
      </button>
    </div>
  );
}
