import React, { useMemo } from 'react';

export default function Timer({ seconds, total, size = 60 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = total > 0 ? seconds / total : 0;
  const dashoffset = circumference * (1 - progress);

  const strokeClass = useMemo(() => {
    if (progress <= 0.2) return 'timer__circle--danger';
    if (progress <= 0.4) return 'timer__circle--warning';
    return '';
  }, [progress]);

  return (
    <div className="timer" id="timer" style={{ width: size, height: size }}>
      <svg
        className="timer__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="timer__circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`timer__circle ${strokeClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <span className="timer__text">{Math.ceil(seconds)}</span>
    </div>
  );
}
