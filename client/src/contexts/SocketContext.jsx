import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : `${window.location.protocol}//${window.location.hostname}:3005`;

const SESSION_KEY = 'speedbac_session_id';

// Fallback memory storage for Safari Private Mode / blocked cookies
const memoryStorage = {};
export const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(() => safeLocalStorage.getItem(SESSION_KEY));

  useEffect(() => {
    const storedSession = safeLocalStorage.getItem(SESSION_KEY);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      auth: storedSession ? { sessionId: storedSession } : {},
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('session:id', (data) => {
      if (data && data.sessionId) {
        safeLocalStorage.setItem(SESSION_KEY, data.sessionId);
        setSessionId(data.sessionId);
      }
    });

    socket.on('session:invalid', () => {
      safeLocalStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearSession = useCallback(() => {
    safeLocalStorage.removeItem(SESSION_KEY);
    setSessionId(null);
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    sessionId,
    clearSession,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}

export default SocketContext;
