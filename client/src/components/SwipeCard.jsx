import React, { useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 100;
const MAX_ROTATION = 15;

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight, id }) {
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDragging = useRef(false);

  const [offset, setOffset] = useState(0);
  const [exiting, setExiting] = useState(null);

  const getDirection = useCallback((dx) => {
    if (dx > 40) return 'right';
    if (dx < -40) return 'left';
    return null;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (exiting) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = 0;
    isDragging.current = true;
  }, [exiting]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || exiting) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    // If vertical scroll is dominant, don't intercept
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(currentXRef.current) < 10) {
      return;
    }

    e.preventDefault();
    currentXRef.current = dx;
    setOffset(dx);
  }, [exiting]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || exiting) return;
    isDragging.current = false;

    const dx = currentXRef.current;

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      const direction = dx > 0 ? 'right' : 'left';
      setExiting(direction);

      setTimeout(() => {
        setOffset(0);
        setExiting(null);
        if (direction === 'right' && onSwipeRight) onSwipeRight();
        if (direction === 'left' && onSwipeLeft) onSwipeLeft();
      }, 300);
    } else {
      setOffset(0);
    }

    currentXRef.current = 0;
  }, [exiting, onSwipeLeft, onSwipeRight]);

  const rotation = (offset / window.innerWidth) * MAX_ROTATION;
  const validOpacity = Math.min(Math.max(offset / SWIPE_THRESHOLD, 0), 1);
  const invalidOpacity = Math.min(Math.max(-offset / SWIPE_THRESHOLD, 0), 1);

  const direction = getDirection(offset);

  const style = exiting
    ? {
        transform: `translateX(${exiting === 'right' ? 400 : -400}px) rotate(${exiting === 'right' ? 20 : -20}deg)`,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        opacity: 0,
      }
    : {
        transform: `translateX(${offset}px) rotate(${rotation}deg)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease',
      };

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${direction === 'right' ? 'swipe-card--swiping-right' : ''} ${direction === 'left' ? 'swipe-card--swiping-left' : ''}`}
      id={id}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="swipe-card__content">
        {children}
        <div
          className="swipe-card__overlay swipe-card__overlay--valid"
          style={{ opacity: validOpacity }}
        >
          ✓
        </div>
        <div
          className="swipe-card__overlay swipe-card__overlay--invalid"
          style={{ opacity: invalidOpacity }}
        >
          ✗
        </div>
      </div>
    </div>
  );
}
