import React from 'react';

export default function LetterCard({ letter, selected, used, disabled, onSelect }) {
  const handleClick = () => {
    if (disabled || used || !onSelect) return;
    onSelect(letter);
  };

  const getClasses = () => {
    let classes = 'letter-card';
    if (selected) classes += ' letter-card--selected';
    if (used) classes += ' letter-card--used';
    if (disabled) classes += ' letter-card--disabled';
    return classes;
  };

  return (
    <div
      className={getClasses()}
      onClick={handleClick}
      role="button"
      tabIndex={disabled || used ? -1 : 0}
      aria-label={`Letter card ${letter}`}
    >
      <span className="letter-card__letter">{letter}</span>
    </div>
  );
}
