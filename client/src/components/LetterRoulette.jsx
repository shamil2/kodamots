import React, { useState, useEffect, useRef, useCallback } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SPIN_DURATION = 2000;
const INITIAL_INTERVAL = 40;
const SLOWDOWN_START = 1200;

export default function LetterRoulette({ letter, onComplete }) {
  const [displayLetter, setDisplayLetter] = useState('A');
  const [phase, setPhase] = useState('spinning'); // spinning | revealed
  const [showFlash, setShowFlash] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!letter) return;

    setPhase('spinning');
    setShowFlash(false);
    startTimeRef.current = Date.now();

    let currentSpeed = INITIAL_INTERVAL;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= SPIN_DURATION) {
        cleanup();
        setDisplayLetter(letter.toUpperCase());
        setPhase('revealed');
        setShowFlash(true);
        timeoutRef.current = setTimeout(() => {
          setShowFlash(false);
          if (onComplete) onComplete();
        }, 800);
        return;
      }

      const randomIdx = Math.floor(Math.random() * ALPHABET.length);
      setDisplayLetter(ALPHABET[randomIdx]);

      if (elapsed > SLOWDOWN_START) {
        const progress = (elapsed - SLOWDOWN_START) / (SPIN_DURATION - SLOWDOWN_START);
        currentSpeed = INITIAL_INTERVAL + progress * 200;
      }

      intervalRef.current = setTimeout(tick, currentSpeed);
    };

    intervalRef.current = setTimeout(tick, INITIAL_INTERVAL);

    return cleanup;
  }, [letter, onComplete, cleanup]);

  return (
    <div className="letter-roulette" id="letter-roulette">
      <div className="letter-roulette__display">
        <span
          className={`letter-roulette__letter ${
            phase === 'spinning'
              ? 'letter-roulette__letter--spinning'
              : 'letter-roulette__letter--revealed'
          }`}
        >
          {displayLetter}
        </span>
        {showFlash && <div className="letter-roulette__flash" />}
      </div>
      <span className="letter-roulette__label">
        {phase === 'spinning' ? '...' : letter?.toUpperCase()}
      </span>
    </div>
  );
}
