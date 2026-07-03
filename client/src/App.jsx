import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { I18nProvider } from './contexts/I18nContext';
import OrientationWarning from './components/OrientationWarning';
import HomeScreen from './screens/HomeScreen';
import DesktopBlockScreen from './screens/DesktopBlockScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import JoinRoomScreen from './screens/JoinRoomScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import VoteScreen from './screens/VoteScreen';
import ScoreScreen from './screens/ScoreScreen';
import FinalScoreScreen from './screens/FinalScoreScreen';
import RapideGameScreen from './screens/RapideGameScreen';
import RapideRoundSummaryScreen from './screens/RapideRoundSummaryScreen';
import { soundManager } from './utils/sounds';

const SCREENS = {
  HOME: 'HOME',
  CREATE_ROOM: 'CREATE_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
  VOTE: 'VOTE',
  SCORES: 'SCORES',
  FINAL_SCORES: 'FINAL_SCORES',
  RAPIDE_GAME: 'RAPIDE_GAME',
  RAPIDE_ROUND_SUMMARY: 'RAPIDE_ROUND_SUMMARY',
};

function isDesktop() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    && !/Mobi/i.test(ua)
    && window.innerWidth > 1024;
}

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const check = () => {
      // Only show on mobile-sized screens
      if (window.innerWidth > 1024) {
        setIsLandscape(false);
        return;
      }
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isLandscape;
}

function AppContent() {
  const { socket, connected, sessionId, clearSession } = useSocket();

  // Sound effects state
  const [soundsEnabled, setSoundsEnabled] = useState(() => soundManager.isEnabled());

  const toggleSound = useCallback(() => {
    const nextVal = !soundsEnabled;
    setSoundsEnabled(nextVal);
    soundManager.toggle(nextVal);
    if (nextVal) {
      soundManager.play('click');
    }
  }, [soundsEnabled]);

  // State machine
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [config, setConfig] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');

  // Game mode config
  const [gameMode, setGameMode] = useState('petit_bac');

  // Game state (Classic Petit Bac)
  const [letter, setLetter] = useState('');
  const [categories, setCategories] = useState([]);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [gamePhase, setGamePhase] = useState('LETTER_SPIN');
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [countdownTriggeredBy, setCountdownTriggeredBy] = useState('');
  const [nextRoundCountdown, setNextRoundCountdown] = useState(null);
  const [myPseudoState, setMyPseudoState] = useState('');

  // Game state (Rapide mode)
  const [rapideMyCards, setRapideMyCards] = useState([]);
  const [rapidePlayerCards, setRapidePlayerCards] = useState({});
  const [rapideTheme, setRapideTheme] = useState('');
  const [rapideThemeIndex, setRapideThemeIndex] = useState(0);
  const [rapideValidCount, setRapideValidCount] = useState(0);
  const [rapideAnswersNeeded, setRapideAnswersNeeded] = useState(3);
  const [rapideAnswerFeed, setRapideAnswerFeed] = useState([]);
  const [rapideRoundData, setRapideRoundData] = useState(null);
  const [rapideScoreLimit, setRapideScoreLimit] = useState(40);
  const [rapideRoundNum, setRapideRoundNum] = useState(1);
  const [rapideTotalRounds, setRapideTotalRounds] = useState(5);
  const [activeChallenge, setActiveChallenge] = useState(null);

  // Vote state
  const [votingData, setVotingData] = useState([]);

  // Score state
  const [roundScores, setRoundScores] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  // Error state
  const [error, setError] = useState('');

  // Desktop detection
  const [isDesktopDevice] = useState(() => isDesktop());
  const isLandscape = useOrientation();

  // Check URL for room code
  const initialRoomCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  }, []);

  // Session restore on mount/connect once child listeners are active
  useEffect(() => {
    if (socket && connected) {
      const storedSession = localStorage.getItem('speedbac_session_id');
      if (storedSession) {
        socket.emit('session:restore', { sessionId: storedSession });
      }
    }
  }, [socket, connected]);

  // Derived host status based on persistent sessionId
  useEffect(() => {
    if (!players || !sessionId) return;
    const me = players.find(p => p.sessionId === sessionId || p.id === sessionId);
    if (me) {
      setIsHost(!!me.isHost);
    }
  }, [players, sessionId]);

  // Screen Wake Lock (Keep Screen On)
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Acquired successfully');
      } catch (err) {
        console.warn('[WakeLock] Failed to acquire lock:', err.message);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          console.log('[WakeLock] Released successfully');
        } catch (err) {
          console.error('[WakeLock] Error releasing lock:', err.message);
        }
        wakeLock = null;
      }
    };

    // Keep awake if roomCode is active and not on HOME/JOIN screens
    const shouldKeepAwake = roomCode && screen !== SCREENS.HOME && screen !== SCREENS.JOIN_ROOM;

    if (shouldKeepAwake) {
      requestWakeLock();

      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          await requestWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        releaseWakeLock();
      };
    }
  }, [screen, roomCode]);

  // Auto-navigate to join if room code in URL and session not restoring
  useEffect(() => {
    const storedSession = localStorage.getItem('speedbac_session_id');
    // If there is no active session stored, go ahead and navigate to join screen
    if (initialRoomCode && screen === SCREENS.HOME && !storedSession) {
      setScreen(SCREENS.JOIN_ROOM);
    }
  }, [initialRoomCode, screen]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room created
    const handleRoomCreated = (data) => {
      setRoomCode(data.roomCode);
      setPlayers(data.roomState?.players || []);
      setConfig(data.roomState?.config || null);
      setGameMode(data.roomState?.config?.gameMode || 'petit_bac');
      setIsHost(true);
      setMyPlayerId(socket.id);
      setScreen(SCREENS.LOBBY);

      const me = (data.roomState?.players || []).find((p) => p.socketId === socket.id);
      if (me) {
        setMyPseudoState(me.name || me.pseudo || '');
      }

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.roomCode);
      window.history.replaceState({}, '', url.toString());
    };

    // Room joined
    const handleRoomJoined = (data) => {
      const state = data.roomState || data;
      setRoomCode(state.roomCode || roomCode);
      setPlayers(state.players || []);
      setConfig(state.config || null);
      setGameMode(state.config?.gameMode || 'petit_bac');
      setIsHost(false);
      setMyPlayerId(socket.id);
      setScreen(SCREENS.LOBBY);

      const me = (state.players || []).find((p) => p.socketId === socket.id);
      if (me) {
        setMyPseudoState(me.name || me.pseudo || '');
      }
    };

    // Player updates
    const handlePlayerJoined = (data) => {
      setPlayers(data.players || []);
    };

    const handlePlayerLeft = (data) => {
      setPlayers(data.players || []);
    };

    // Room error
    const handleRoomError = (data) => {
      setError(data.message || 'Error');
      // Reset loading states by briefly touching the screen state
    };

    // Game: letter spin
    const handleLetterSpin = (data) => {
      soundManager.play('start');
      setNextRoundCountdown(null);
      setLetter(data.letter);
      setRound(data.round || 1);
      setTotalRounds(data.totalRounds || 3);
      setGamePhase('LETTER_SPIN');
      setCountdownSeconds(null);
      setScreen(SCREENS.GAME);
    };

    // Game: input phase
    const handleInputPhase = (data) => {
      soundManager.play('start');
      setCategories(data.categories || []);
      setLetter(data.letter || letter);
      setRound(data.round || round);
      setGamePhase('INPUT');
      setScreen(SCREENS.GAME);
    };

    // Game: countdown
    const handleCountdown = (data) => {
      setCountdownSeconds(data.seconds);
      setCountdownTriggeredBy(data.triggeredBy || '');
      setGamePhase('COUNTDOWN');
    };

    // Game: inputs locked
    const handleInputsLocked = () => {
      // Handled in GameScreen component
    };

    // Vote start
    const handleVoteStart = (data) => {
      setVotingData(data.votingData || []);
      setScreen(SCREENS.VOTE);
    };

    // Score: round results
    const handleRoundResults = (data) => {
      soundManager.play('success');
      setRoundScores(data.scores || null);
      setLeaderboard(data.leaderboard || []);
      setRound(data.round || round);
      setScreen(SCREENS.SCORES);
    };

    // Score: final results
    const handleFinalResults = (data) => {
      soundManager.play('victory');
      setFinalLeaderboard(data.finalLeaderboard || []);
      setScreen(SCREENS.FINAL_SCORES);
    };

    // Session restored
    const handleSessionRestored = (data) => {
      const mode = data.gameMode || data.roomState?.config?.gameMode || 'petit_bac';
      setGameMode(mode);

      if (data.roomCode) setRoomCode(data.roomCode);
      if (data.roomState) {
        setPlayers(data.roomState.players || []);
        setConfig(data.roomState.config || null);
        setIsHost(data.roomState.hostId === socket.id);
        setMyPlayerId(socket.id);

        const me = (data.roomState.players || []).find(
          (p) => p.sessionId === sessionId || p.socketId === socket.id
        );
        if (me) {
          setMyPseudoState(me.name || me.pseudo || '');
        }
      }

      if (mode === 'rapide') {
        const state = data.roomState || {};
        
        // Restore Rapide states
        if (state.theme) setRapideTheme(state.theme);
        if (state.themeIndex !== undefined) setRapideThemeIndex(state.themeIndex);
        if (state.validAnswersCount !== undefined) setRapideValidCount(state.validAnswersCount);
        if (state.answersNeeded !== undefined) setRapideAnswersNeeded(state.answersNeeded);
        if (state.currentRound !== undefined) setRapideRoundNum(state.currentRound);
        if (state.totalRounds !== undefined) setRapideTotalRounds(state.totalRounds);
        if (state.recentAnswers) setRapideAnswerFeed(state.recentAnswers);
        
        // Build cards maps
        const cardsMap = {};
        if (state.players) {
          state.players.forEach(p => {
            cardsMap[p.sessionId] = p.cards || [];
          });
          setRapidePlayerCards(cardsMap);
          
          // My cards
          const me = state.players.find(p => p.sessionId === sessionId);
          if (me) {
            setRapideMyCards(me.cards || []);
          }
        }

        // Restore active challenge if any
        if (state.recentAnswers) {
          const challenged = state.recentAnswers.find(a => a.status === 'challenged');
          if (challenged) {
            setActiveChallenge({
              answerId: challenged.answerId,
              playerId: challenged.playerId,
              pseudo: challenged.pseudo,
              avatarId: challenged.avatarId,
              word: challenged.word,
              letter: challenged.letter,
              acceptVotes: 0,
              rejectVotes: 0,
              totalVoters: state.players ? state.players.length : 2,
            });
          }
        }

        // Restore screen
        switch (data.gamePhase) {
          case 'LOBBY':
            setScreen(SCREENS.LOBBY);
            break;
          case 'PLAYING':
            setScreen(SCREENS.RAPIDE_GAME);
            break;
          case 'ROUND_SUMMARY':
            setScreen(SCREENS.RAPIDE_ROUND_SUMMARY);
            break;
          case 'FINAL_SCORES':
            setScreen(SCREENS.FINAL_SCORES);
            break;
          default:
            setScreen(SCREENS.LOBBY);
        }
      } else {
        // Restore to the appropriate screen (Petit Bac)
        switch (data.gamePhase) {
          case 'LOBBY':
            setScreen(SCREENS.LOBBY);
            break;
          case 'LETTER_SPIN':
          case 'INPUT':
          case 'COUNTDOWN':
            setGamePhase(data.gamePhase);
            if (data.letter) setLetter(data.letter);
            if (data.categories) setCategories(data.categories);
            if (data.round) setRound(data.round);
            if (data.totalRounds) setTotalRounds(data.totalRounds);
            setScreen(SCREENS.GAME);
            break;
          case 'VOTING':
            if (data.votingData) setVotingData(data.votingData);
            setScreen(SCREENS.VOTE);
            break;
          case 'SCORES':
            setScreen(SCREENS.SCORES);
            break;
          case 'FINAL_SCORES':
            setScreen(SCREENS.FINAL_SCORES);
            break;
          default:
            setScreen(SCREENS.LOBBY);
        }
      }
    };

    const handleSessionInvalid = () => {
      localStorage.removeItem('speedbac_session_id');
      if (initialRoomCode) {
        setScreen(SCREENS.JOIN_ROOM);
      } else {
        setScreen(SCREENS.HOME);
      }
    };

    const handleNextRoundCountdown = (data) => {
      setNextRoundCountdown(data.seconds);
      if (data.seconds > 0) {
        soundManager.play('tick');
      }
    };

    // Rapide mode listeners
    const handleRapideGameStarted = (data) => {
      soundManager.play('start');
      setRapidePlayerCards(data.playerCards);
      setRapideMyCards(data.playerCards[sessionId] || []);
      setRapideTheme(data.theme);
      setRapideThemeIndex(data.themeIndex);
      setRapideValidCount(data.validAnswersCount);
      setRapideAnswersNeeded(data.answersNeeded);
      setRapideRoundNum(data.round);
      setRapideTotalRounds(data.totalRounds);
      setRapideScoreLimit(data.scoreLimit);
      setRapideAnswerFeed([]);
      setActiveChallenge(null);
      setScreen(SCREENS.RAPIDE_GAME);
    };

    const handleRapideThemeChanged = (data) => {
      setRapideTheme(data.theme);
      setRapideThemeIndex(data.themeIndex);
      setRapideValidCount(0);
      setRapideAnswerFeed([]);
    };

    const handleRapideAnswerSubmitted = (data) => {
      setRapideAnswerFeed((prev) => [data, ...prev].slice(0, 20));
    };

    const handleRapideAnswerAccepted = (data) => {
      soundManager.play('success');
      setRapideValidCount(data.validAnswersCount);
      setRapidePlayerCards((prev) => ({ ...prev, [data.playerId]: data.playerCards }));
      if (data.playerId === sessionId) {
        setRapideMyCards(data.playerCards);
      }
      setRapideAnswerFeed((prev) =>
        prev.map((a) => (a.answerId === data.answerId ? { ...a, status: 'accepted' } : a))
      );
      setActiveChallenge((prev) => (prev && prev.answerId === data.answerId ? null : prev));
    };

    const handleRapideAnswerRejected = (data) => {
      soundManager.play('fail');
      if (data.playerId === sessionId) {
        setRapideMyCards((prev) => [...prev, data.letter]);
      }
      setRapideAnswerFeed((prev) =>
        prev.map((a) => (a.answerId === data.answerId ? { ...a, status: 'rejected' } : a))
      );
      setActiveChallenge((prev) => (prev && prev.answerId === data.answerId ? null : prev));
    };

    const handleRapideChallengeStarted = (data) => {
      soundManager.play('fail');
      setActiveChallenge({
        answerId: data.answerId,
        playerId: data.playerId,
        challengerId: data.challengerId,
        word: data.word,
        letter: data.letter,
        acceptVotes: 0,
        rejectVotes: 0,
        totalVoters: players.length,
      });
      setRapideAnswerFeed((prev) =>
        prev.map((a) => (a.answerId === data.answerId ? { ...a, status: 'challenged' } : a))
      );
    };

    const handleRapideChallengeVoteUpdate = (data) => {
      setActiveChallenge((prev) => {
        if (!prev || prev.answerId !== data.answerId) return prev;
        return {
          ...prev,
          acceptVotes: data.acceptVotes,
          rejectVotes: data.rejectVotes,
          totalVoters: data.totalVoters,
        };
      });
    };

    const handleRapideRoundEnded = (data) => {
      soundManager.play('success');
      setRapideRoundData(data);
      setLeaderboard(data.scores);
      setActiveChallenge(null);
      setScreen(SCREENS.RAPIDE_ROUND_SUMMARY);
    };

    const handleRapideNewRoundStarted = (data) => {
      soundManager.play('start');
      setRapideMyCards(data.playerCards[sessionId] || []);
      setRapidePlayerCards(data.playerCards);
      setRapideTheme(data.theme);
      setRapideThemeIndex(data.themeIndex);
      setRapideValidCount(0);
      setRapideRoundNum(data.round);
      setRapideAnswerFeed([]);
      setActiveChallenge(null);
      setScreen(SCREENS.RAPIDE_GAME);
    };

    const handleRapideFinalScores = (data) => {
      soundManager.play('victory');
      setFinalLeaderboard(data.finalLeaderboard);
      setActiveChallenge(null);
      setScreen(SCREENS.FINAL_SCORES);
    };

    const handleRapideThemeSkipped = (data) => {
      setRapideTheme(data.newTheme);
      setRapideThemeIndex(data.themeIndex);
      setRapideValidCount(0);
      setRapideAnswerFeed([]);
    };

    const handleRapidePlayerHandUpdate = (data) => {
      if (data.playerId === sessionId) {
        setRapideMyCards(data.cards);
      }
      setRapidePlayerCards((prev) => ({ ...prev, [data.playerId]: data.cards }));
    };

    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:playerJoined', handlePlayerJoined);
    socket.on('room:playerLeft', handlePlayerLeft);
    socket.on('room:playerList', handlePlayerJoined);
    socket.on('room:error', handleRoomError);
    socket.on('game:letterSpin', handleLetterSpin);
    socket.on('game:inputPhase', handleInputPhase);
    socket.on('game:countdown', handleCountdown);
    socket.on('game:inputsLocked', handleInputsLocked);
    socket.on('vote:start', handleVoteStart);
    socket.on('vote:results', () => {});
    socket.on('score:roundResults', handleRoundResults);
    socket.on('score:finalResults', handleFinalResults);
    socket.on('session:restored', handleSessionRestored);
    socket.on('session:invalid', handleSessionInvalid);
    socket.on('game:nextRoundCountdown', handleNextRoundCountdown);

    // Bind Rapide mode listeners
    socket.on('rapide:gameStarted', handleRapideGameStarted);
    socket.on('rapide:themeChanged', handleRapideThemeChanged);
    socket.on('rapide:answerSubmitted', handleRapideAnswerSubmitted);
    socket.on('rapide:answerAccepted', handleRapideAnswerAccepted);
    socket.on('rapide:answerRejected', handleRapideAnswerRejected);
    socket.on('rapide:challengeStarted', handleRapideChallengeStarted);
    socket.on('rapide:challengeVoteUpdate', handleRapideChallengeVoteUpdate);
    socket.on('rapide:roundEnded', handleRapideRoundEnded);
    socket.on('rapide:newRoundStarted', handleRapideNewRoundStarted);
    socket.on('rapide:finalScores', handleRapideFinalScores);
    socket.on('rapide:themeSkipped', handleRapideThemeSkipped);
    socket.on('rapide:playerHandUpdate', handleRapidePlayerHandUpdate);

    return () => {
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:playerJoined', handlePlayerJoined);
      socket.off('room:playerLeft', handlePlayerLeft);
      socket.off('room:playerList', handlePlayerJoined);
      socket.off('room:error', handleRoomError);
      socket.off('game:letterSpin', handleLetterSpin);
      socket.off('game:inputPhase', handleInputPhase);
      socket.off('game:countdown', handleCountdown);
      socket.off('game:inputsLocked', handleInputsLocked);
      socket.off('vote:start', handleVoteStart);
      socket.off('vote:results');
      socket.off('score:roundResults', handleRoundResults);
      socket.off('score:finalResults', handleFinalResults);
      socket.off('session:restored', handleSessionRestored);
      socket.off('session:invalid', handleSessionInvalid);
      socket.off('game:nextRoundCountdown', handleNextRoundCountdown);

      // Unbind Rapide mode listeners
      socket.off('rapide:gameStarted', handleRapideGameStarted);
      socket.off('rapide:themeChanged', handleRapideThemeChanged);
      socket.off('rapide:answerSubmitted', handleRapideAnswerSubmitted);
      socket.off('rapide:answerAccepted', handleRapideAnswerAccepted);
      socket.off('rapide:answerRejected', handleRapideAnswerRejected);
      socket.off('rapide:challengeStarted', handleRapideChallengeStarted);
      socket.off('rapide:challengeVoteUpdate', handleRapideChallengeVoteUpdate);
      socket.off('rapide:roundEnded', handleRapideRoundEnded);
      socket.off('rapide:newRoundStarted', handleRapideNewRoundStarted);
      socket.off('rapide:finalScores', handleRapideFinalScores);
      socket.off('rapide:themeSkipped', handleRapideThemeSkipped);
      socket.off('rapide:playerHandUpdate', handleRapidePlayerHandUpdate);
    };
  }, [socket, roomCode, letter, round]);

  // Clear error after 4s
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  // Navigation callbacks
  const goHome = useCallback(() => {
    setScreen(SCREENS.HOME);
    setRoomCode('');
    setPlayers([]);
    setConfig(null);
    setIsHost(false);
    setError('');
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('room:leave', {});
    }
    clearSession();
    setRoomCode('');
    setPlayers([]);
    setConfig(null);
    setIsHost(false);
    setError('');
    setScreen(SCREENS.HOME);
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, [socket, clearSession]);

  const handleGamePhaseChange = useCallback((phase) => {
    setGamePhase(phase);
  }, []);

  const handleNextRound = useCallback(() => {
    if (socket) {
      if (gameMode === 'rapide') {
        socket.emit('rapide:nextRound', { roomCode });
      } else {
        socket.emit('game:nextRound', { roomCode });
      }
    }
  }, [socket, roomCode, gameMode]);

  const handlePlayAgain = useCallback(() => {
    if (socket) {
      socket.emit('game:start', { roomCode });
    }
  }, [socket, roomCode]);

  // Desktop block
  if (isDesktopDevice) {
    return <DesktopBlockScreen />;
  }

  // Render screen
  const renderScreen = () => {
    switch (screen) {
      case SCREENS.HOME:
        return (
          <HomeScreen
            onCreateRoom={() => setScreen(SCREENS.CREATE_ROOM)}
            onJoinRoom={() => setScreen(SCREENS.JOIN_ROOM)}
          />
        );

      case SCREENS.CREATE_ROOM:
        return (
          <CreateRoomScreen
            onBack={goHome}
            onRoomCreated={() => {}}
          />
        );

      case SCREENS.JOIN_ROOM:
        return (
          <JoinRoomScreen
            onBack={goHome}
            initialCode={initialRoomCode}
          />
        );

      case SCREENS.LOBBY:
        return (
          <LobbyScreen
            roomCode={roomCode}
            players={players}
            config={config}
            isHost={isHost}
            onQuit={leaveRoom}
          />
        );

      case SCREENS.GAME:
        return (
          <GameScreen
            roomCode={roomCode}
            letter={letter}
            categories={categories}
            round={round}
            totalRounds={totalRounds}
            gamePhase={gamePhase}
            countdownSeconds={countdownSeconds}
            countdownTriggeredBy={countdownTriggeredBy}
            onPhaseChange={handleGamePhaseChange}
            onQuit={leaveRoom}
          />
        );

      case SCREENS.RAPIDE_GAME:
        return (
          <RapideGameScreen
            roomCode={roomCode}
            players={players}
            myPlayerId={sessionId}
            myCards={rapideMyCards}
            playerCardsMap={rapidePlayerCards}
            theme={rapideTheme}
            themeIndex={rapideThemeIndex}
            validCount={rapideValidCount}
            answersNeeded={rapideAnswersNeeded}
            answerFeed={rapideAnswerFeed}
            roundNum={rapideRoundNum}
            totalRounds={rapideTotalRounds}
            isHost={isHost}
            onQuit={leaveRoom}
            activeChallenge={activeChallenge}
          />
        );

      case SCREENS.VOTE: {
        const me = players.find(p => p.sessionId === sessionId || p.id === sessionId);
        return (
          <VoteScreen
            roomCode={roomCode}
            votingData={votingData}
            myPlayerId={sessionId}
            myPseudo={myPseudoState || (me ? me.name || me.pseudo : '')}
            onQuit={leaveRoom}
          />
        );
      }

      case SCREENS.SCORES:
        return (
          <ScoreScreen
            scores={roundScores}
            leaderboard={leaderboard}
            round={round}
            totalRounds={totalRounds}
            onNextRound={handleNextRound}
            isHost={isHost}
            onQuit={leaveRoom}
            nextRoundCountdown={nextRoundCountdown}
          />
        );

      case SCREENS.RAPIDE_ROUND_SUMMARY:
        return (
          <RapideRoundSummaryScreen
            roundData={rapideRoundData}
            onNextRound={handleNextRound}
            isHost={isHost}
            nextRoundCountdown={nextRoundCountdown}
          />
        );

      case SCREENS.FINAL_SCORES:
        return (
          <FinalScoreScreen
            leaderboard={finalLeaderboard}
            onPlayAgain={handlePlayAgain}
            onNewRoom={leaveRoom}
            isLowestWins={gameMode === 'rapide'}
          />
        );

      default:
        return <HomeScreen onCreateRoom={() => setScreen(SCREENS.CREATE_ROOM)} onJoinRoom={() => setScreen(SCREENS.JOIN_ROOM)} />;
    }
  };

  const getAppBackgroundClass = () => {
    switch (screen) {
      case SCREENS.HOME:
      case SCREENS.CREATE_ROOM:
      case SCREENS.JOIN_ROOM:
        return 'app--home';
      case SCREENS.LOBBY:
        return 'app--lobby';
      case SCREENS.GAME:
        return 'app--game';
      case SCREENS.RAPIDE_GAME:
        return 'app--rapide';
      case SCREENS.VOTE:
        return 'app--vote';
      case SCREENS.SCORES:
      case SCREENS.RAPIDE_ROUND_SUMMARY:
      case SCREENS.FINAL_SCORES:
        return 'app--scores';
      default:
        return 'app--home';
    }
  };

  return (
    <div className={`app ${getAppBackgroundClass()}`}>
      {isLandscape && <OrientationWarning />}
      
      {screen !== SCREENS.HOME && (
        <button
          onClick={toggleSound}
          className="sound-toggle-btn"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'var(--color-surface)',
            border: '2px solid var(--color-text)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.15rem',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            color: 'var(--color-text)',
            fontWeight: 'bold'
          }}
          title="Toggle Sound"
        >
          {soundsEnabled ? '🔊' : '🔇'}
        </button>
      )}

      {renderScreen()}
      {error && <div className="toast" id="error-toast">{error}</div>}
      {!connected && screen !== SCREENS.HOME && (
        <div className="toast" id="connection-toast" style={{ background: 'var(--color-coral)' }}>
          ⚠️ Reconnecting...
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </I18nProvider>
  );
}
