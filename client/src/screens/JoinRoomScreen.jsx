import React, { useState, useCallback, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useSocket, safeLocalStorage } from '../contexts/SocketContext';
import AvatarPicker from '../components/AvatarPicker';
import { DEFAULT_AVATAR_ID } from '../avatars';

export default function JoinRoomScreen({ onBack, initialCode }) {
  const { t } = useI18n();
  const { socket } = useSocket();

  const [pseudo, setPseudo] = useState(() => safeLocalStorage.getItem('speedbac_username') || '');
  const [avatarId, setAvatarId] = useState(() => safeLocalStorage.getItem('speedbac_avatar') || DEFAULT_AVATAR_ID);
  const [code, setCode] = useState(() => {
    if (initialCode) return initialCode.toUpperCase().split('').slice(0, 4);
    return ['', '', '', ''];
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleCodeChange = useCallback((index, value) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });

    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleCodeKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const handleCodePaste = useCallback((e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (paste.length > 0) {
      setCode(paste.split('').concat(['', '', '', '']).slice(0, 4));
      const nextFocus = Math.min(paste.length, 3);
      inputRefs.current[nextFocus]?.focus();
    }
  }, []);

  const handleJoin = useCallback(() => {
    const trimmedPseudo = pseudo.trim();
    if (!trimmedPseudo) {
      setError(t('join.error.pseudo'));
      return;
    }

    const roomCode = code.join('');
    if (roomCode.length < 4) {
      setError(t('join.error.code'));
      return;
    }

    // Save username and avatar persistently
    safeLocalStorage.setItem('speedbac_username', trimmedPseudo);
    safeLocalStorage.setItem('speedbac_avatar', avatarId);

    setError('');
    setLoading(true);

    socket.emit('room:join', {
      roomCode,
      pseudo: trimmedPseudo,
      avatarId,
    });
  }, [pseudo, avatarId, code, socket, t]);

  return (
    <div className="screen join-room" id="join-room-screen">
      <h1 className="join-room__title">{t('join.title')}</h1>

      <div className="join-room__form">
        {/* Avatar selection */}
        <div className="input-group">
          <label className="input-label">🐾 {t('create.avatar') || 'Ton personnage'}</label>
          <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="join-pseudo-input">
            {t('join.pseudo')}
          </label>
          <input
            id="join-pseudo-input"
            className="input"
            type="text"
            placeholder={t('join.pseudoPlaceholder')}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            {t('join.roomCode')}
          </label>
          <div className="join-room__code-inputs" onPaste={handleCodePaste}>
            {code.map((char, i) => (
              <input
                key={i}
                id={`join-code-${i}`}
                ref={(el) => { inputRefs.current[i] = el; }}
                className="join-room__code-char"
                type="text"
                inputMode="text"
                value={char}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                maxLength={2}
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                autoComplete="off"
              />
            ))}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="join-room__actions">
          <button
            id="btn-join-submit"
            className={`btn btn--primary btn--large btn--full ${loading ? 'btn--disabled' : ''}`}
            onClick={handleJoin}
            type="button"
            disabled={loading}
          >
            {loading ? '...' : t('join.joinBtn')}
          </button>
          <button
            id="btn-join-back"
            className="btn btn--ghost"
            onClick={onBack}
            type="button"
          >
            {t('join.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
