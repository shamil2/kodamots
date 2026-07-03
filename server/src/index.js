const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const gameManager = require('./GameManager');
const dictionaryService = require('./DictionaryService');
const { CATEGORIES, LANGUAGES } = require('./constants');

// ─── Load dictionaries at startup ────────────────────────────────────────────
dictionaryService.load();

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Game stats (for debugging)
app.get('/stats', (req, res) => {
  res.json(gameManager.getStats());
});

// Categories endpoint
app.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

// Dictionary word check (optional utility endpoint)
app.get('/check-word', (req, res) => {
  const { word, lang } = req.query;
  if (!word) return res.status(400).json({ error: 'Missing "word" query parameter' });
  const language = lang || 'mixed';
  res.json({
    word,
    language,
    valid: dictionaryService.isValidWord(word, language),
  });
});

const path = require('path');

// Serve static client assets in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  // SPA routing fallback
  app.get('*splat', (req, res, next) => {
    if (
      req.path.startsWith('/health') ||
      req.path.startsWith('/stats') ||
      req.path.startsWith('/categories') ||
      req.path.startsWith('/check-word')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

gameManager.setIO(io);

// ─── Socket Event Handlers ───────────────────────────────────────────────────
io.on('connection', (socket) => {
  let sessionId = socket.handshake.auth?.sessionId;
  let isNewSession = false;

  if (sessionId) {
    console.log(`[Socket] Connected: ${socket.id} (Existing Session: ${sessionId})`);
  } else {
    sessionId = 'sb_' + Math.random().toString(36).substring(2, 11);
    isNewSession = true;
    console.log(`[Socket] Connected: ${socket.id} (New Session: ${sessionId})`);
    // Send the generated session ID to the client immediately
    socket.emit('session:id', { sessionId });
  }

  // ── Session Restore ─────────────────────────────────────────────
  socket.on('session:restore', (data) => {
    const sid = data?.sessionId || sessionId;
    sessionId = sid;
    console.log(`[Socket] Restoring session: ${sid} for socket: ${socket.id}`);

    const roomState = gameManager.getRoomState(sid);
    if (roomState) {
      const room = gameManager.rooms.get(roomState.code);
      if (room) {
        // Re-associate player's socket connection
        room.addPlayer(socket.id, sid, room.players.get(sid)?.name);
        socket.join(room.code);

        const isRapide = roomState.gameMode === 'rapide';
        
        // Emit session:restored to the client
        socket.emit('session:restored', {
          roomCode: room.code,
          roomState: roomState,
          gameMode: roomState.gameMode || 'petit_bac',
          gamePhase: roomState.phase,
          letter: isRapide ? null : room.currentLetter,
          categories: isRapide ? null : room.categories,
          round: isRapide ? roomState.currentRound : room.currentRound,
          totalRounds: isRapide ? roomState.totalRounds : room.totalRounds,
          votingData: !isRapide && room.phase === 'VOTING' ? room.getVotingData() : [],
          // Rapide-specific extra restoration keys:
          theme: isRapide ? roomState.theme : null,
          validAnswersCount: isRapide ? roomState.validAnswersCount : null,
          answersNeeded: isRapide ? roomState.answersNeeded : null,
        });

        // Broadcast player list update to room
        io.to(room.code).emit('room:playerList', {
          players: room.getPlayerList(),
        });
      }
    } else {
      if (!isNewSession) {
        console.log(`[Socket] Session ${sid} is stale — cleaning up client session`);
        socket.emit('session:invalid');
      } else {
        console.log(`[Socket] Session ${sid} is new and not in a room yet`);
      }
    }
  });

  // ── Create Room ─────────────────────────────────────────────────
  socket.on('room:create', (data, ack) => {
    const playerName = data?.pseudo || data?.playerName;
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Player name is required' });
      return ack?.({ error: 'Player name is required' });
    }

    const config = data?.config || {};
    const safeConfig = {};
    if (config.language && LANGUAGES.includes(config.language)) {
      safeConfig.language = config.language;
    }
    if (Array.isArray(config.categories) && config.categories.length > 0) {
      safeConfig.categories = config.categories;
    }
    if (typeof config.rounds === 'number') {
      safeConfig.rounds = config.rounds;
    }
    if (typeof config.excludeRareLetters === 'boolean') {
      safeConfig.excludeRareLetters = config.excludeRareLetters;
    }
    if (config.gameMode === 'rapide' || config.gameMode === 'petit_bac') {
      safeConfig.gameMode = config.gameMode;
    } else {
      safeConfig.gameMode = 'petit_bac';
    }
    if (typeof config.cardsPerPlayer === 'number') {
      safeConfig.cardsPerPlayer = config.cardsPerPlayer;
    }
    if (typeof config.answersPerTheme === 'number') {
      safeConfig.answersPerTheme = config.answersPerTheme;
    }
    if (typeof config.scoreLimit === 'number') {
      safeConfig.scoreLimit = config.scoreLimit;
    }

    const avatarId = typeof data?.avatarId === 'string' ? data.avatarId : null;
    const result = gameManager.createRoom(socket.id, sessionId, playerName.trim(), avatarId, safeConfig);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return ack?.({ error: result.error });
    }

    socket.join(result.code);

    // Emit confirmation event back to the creator socket
    socket.emit('room:created', {
      roomCode: result.code,
      roomState: result.room.getState(),
    });

    // Also call acknowledgment if provided
    ack?.({
      success: true,
      code: result.code,
      state: result.room.getState(),
    });
  });

  // ── Join Room ───────────────────────────────────────────────────
  socket.on('room:join', (data, ack) => {
    const playerName = data?.pseudo || data?.playerName;
    const roomCode = data?.roomCode;

    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Player name is required' });
      return ack?.({ error: 'Player name is required' });
    }
    if (!roomCode || typeof roomCode !== 'string' || !roomCode.trim()) {
      socket.emit('room:error', { message: 'Room code is required' });
      return ack?.({ error: 'Room code is required' });
    }

    const playerAvatarId = typeof data?.avatarId === 'string' ? data.avatarId : null;
    const result = gameManager.joinRoom(socket.id, sessionId, playerName.trim(), playerAvatarId, roomCode);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return ack?.({ error: result.error });
    }

    socket.join(result.code);

    // Emit confirmation event back to the joining socket
    socket.emit('room:joined', {
      roomState: result.room.getState(),
    });

    // Broadcast updated player list to room
    io.to(result.code).emit('room:playerList', {
      players: result.room.getPlayerList(),
    });

    ack?.({
      success: true,
      code: result.code,
      reconnected: result.reconnected,
      state: result.room.getState(),
    });
  });

  // ── Leave Room ───────────────────────────────────────────────────
  socket.on('room:leave', (data, ack) => {
    const code = gameManager.playerRoomMap.get(sessionId);
    gameManager.leaveRoom(sessionId);
    if (code) {
      socket.leave(code);
    }
    ack?.({ success: true });
  });

  // ── Start Game ──────────────────────────────────────────────────
  socket.on('game:start', (data, ack) => {
    const result = gameManager.startGame(sessionId);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Next Round ──────────────────────────────────────────────────
  socket.on('game:nextRound', (data, ack) => {
    const result = gameManager.nextRound(sessionId);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Submit Answers ──────────────────────────────────────────────
  socket.on('game:submitAnswers', (data, ack) => {
    const { answers } = data || {};
    if (!answers || typeof answers !== 'object') {
      return ack?.({ error: 'Answers object is required' });
    }

    const result = gameManager.submitAnswers(sessionId, answers);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Speed Pressed ───────────────────────────────────────────────
  socket.on('game:speedPressed', (data, ack) => {
    const result = gameManager.handleSpeedPressed(sessionId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Cast Vote ───────────────────────────────────────────────────
  socket.on('vote:cast', (data, ack) => {
    const { answerId, valid } = data || {};
    if (!answerId || typeof valid !== 'boolean') {
      return ack?.({ error: 'answerId and valid (boolean) are required' });
    }

    // Parse answerId (which is structured as "targetSessionId:category")
    const parts = answerId.split(':');
    if (parts.length < 2) {
      return ack?.({ error: 'Invalid answerId format' });
    }
    const targetSessionId = parts[0];
    const category = parts.slice(1).join(':'); // handles categories containing colons if any

    const result = gameManager.castVote(sessionId, targetSessionId, category, valid);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Finish Voting ──────────────────────────────────────────────
  socket.on('vote:finish', (data, ack) => {
    const result = gameManager.finishVoting(sessionId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true, allDone: result.allDone });
  });

  // ── Restart Game / Play Again ──────────────────────────────────
  socket.on('game:restart', (data, ack) => {
    const result = gameManager.restartGame(sessionId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Rapide Mode Actions ─────────────────────────────────────────
  socket.on('rapide:submitAnswer', (data, ack) => {
    const { word, letter } = data || {};
    if (!word || !letter) return ack?.({ error: 'word and letter are required' });
    const result = gameManager.rapideSubmitAnswer(sessionId, word.trim(), letter.trim());
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  socket.on('rapide:challengeAnswer', (data, ack) => {
    const { answerId } = data || {};
    if (!answerId) return ack?.({ error: 'answerId is required' });
    const result = gameManager.rapideChallengeAnswer(sessionId, answerId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  socket.on('rapide:vote', (data, ack) => {
    const { answerId, accept } = data || {};
    if (!answerId || typeof accept !== 'boolean') {
      return ack?.({ error: 'answerId and accept (boolean) are required' });
    }
    const result = gameManager.rapideCastVote(sessionId, answerId, accept);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  socket.on('rapide:skipTheme', (data, ack) => {
    const result = gameManager.rapideSkipTheme(sessionId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  socket.on('rapide:nextRound', (data, ack) => {
    const result = gameManager.rapideNextRound(sessionId);
    if (result.error) {
      return ack?.({ error: result.error });
    }
    ack?.({ success: true });
  });

  // ── Get Room State (reconnection) ──────────────────────────────
  socket.on('room:getState', (data, ack) => {
    const state = gameManager.getRoomState(sessionId);
    if (!state) {
      return ack?.({ error: 'You are not in a room' });
    }
    ack?.({ success: true, state });
  });

  // ── Disconnect ─────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    if (sessionId) {
      gameManager.handleDisconnect(sessionId, socket.id);
    }
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║              🌱  Kodamots — Server  🌱            ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  Port:    ${String(PORT).padEnd(39)}║`);
  console.log(`║  Words:   FR=${String(dictionaryService.getWordCount('fr')).padEnd(6)} EN=${String(dictionaryService.getWordCount('en')).padEnd(6)}           ║`);
  console.log('║  Status:  Ready                                  ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, server, io };
