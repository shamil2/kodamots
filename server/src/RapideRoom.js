const {
  RAPIDE_PHASES,
  RAPIDE_TIMERS,
  RAPIDE_SCORING,
  RAPIDE_CONFIG,
  LETTER_WEIGHTS_FR,
  LETTER_WEIGHTS_EN,
  RAPIDE_THEMES,
} = require('./constants');

class RapideRoom {
  /**
   * @param {string} code          – 4-char room code
   * @param {string} hostSocketId  – socket id of the creator
   * @param {string} hostSessionId – persistent session id
   * @param {string} hostName      – display name
   * @param {string|null} hostAvatarId - avatar identifier
   * @param {object} config        – { language, cardsPerPlayer, answersPerTheme, scoreLimit, rounds, excludeRareLetters }
   * @param {Function} emit        – (eventName, roomCode, payload) broadcaster
   */
  constructor(code, hostSocketId, hostSessionId, hostName, hostAvatarId, config, emit) {
    this.code = code;
    this.emit = emit;

    // ─── Configuration ──────────────────────────────────────────────
    this.language = config.language || 'fr';
    this.cardsPerPlayer = Math.min(
      Math.max(config.cardsPerPlayer || RAPIDE_CONFIG.DEFAULT_CARDS, RAPIDE_CONFIG.MIN_CARDS),
      RAPIDE_CONFIG.MAX_CARDS
    );
    this.answersPerTheme = Math.min(
      Math.max(config.answersPerTheme || RAPIDE_CONFIG.DEFAULT_ANSWERS_PER_THEME, RAPIDE_CONFIG.MIN_ANSWERS_PER_THEME),
      RAPIDE_CONFIG.MAX_ANSWERS_PER_THEME
    );
    this.scoreLimit = Math.min(
      Math.max(config.scoreLimit || RAPIDE_CONFIG.DEFAULT_SCORE_LIMIT, RAPIDE_CONFIG.MIN_SCORE_LIMIT),
      RAPIDE_CONFIG.MAX_SCORE_LIMIT
    );
    this.totalRounds = Math.min(
      Math.max(config.rounds || RAPIDE_CONFIG.DEFAULT_ROUNDS, RAPIDE_CONFIG.MIN_ROUNDS),
      RAPIDE_CONFIG.MAX_ROUNDS
    );
    this.excludeRareLetters = config.excludeRareLetters !== false;

    // ─── State ──────────────────────────────────────────────────────
    this.phase = RAPIDE_PHASES.LOBBY;
    this.currentRound = 0;
    this.currentTheme = null;
    this.themeIndex = -1;
    this.validAnswersCount = 0;
    
    // Players list: Map<sessionId, PlayerObject>
    this.players = new Map();

    // Answer feed: Map<answerId, AnswerObject>
    this.answers = new Map();

    // ─── Timers ─────────────────────────────────────────────────────
    this._timers = [];
    this._challengeTimers = new Map(); // Map<answerId, timerId>
    this._disconnectTimers = new Map(); // Map<sessionId, timeoutId>

    // ─── Theme Deck ─────────────────────────────────────────────────
    this.themeDeck = [];
    this._shuffleThemes();

    // Add host
    this._addPlayer(hostSocketId, hostSessionId, hostName, hostAvatarId, true);

    console.log(
      `[RapideRoom ${this.code}] Created by "${hostName}" (${hostSessionId}). Lang=${this.language}, Limit=${this.scoreLimit}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PLAYER & CONNECTION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  _addPlayer(socketId, sessionId, name, avatarId, isHost = false) {
    this.players.set(sessionId, {
      socketId,
      sessionId,
      name: name || `Player${this.players.size + 1}`,
      avatarId: avatarId || null,
      isHost,
      connected: true,
      cards: [],
      totalScore: 0,
    });
  }

  addPlayer(socketId, sessionId, name, avatarId) {
    // Reconnection
    if (this.players.has(sessionId)) {
      const player = this.players.get(sessionId);
      player.socketId = socketId;
      player.connected = true;

      if (this._disconnectTimers.has(sessionId)) {
        clearTimeout(this._disconnectTimers.get(sessionId));
        this._disconnectTimers.delete(sessionId);
        console.log(`[RapideRoom ${this.code}] Player "${player.name}" reconnected`);
      }

      return { reconnected: true, player };
    }

    if (this.phase !== RAPIDE_PHASES.LOBBY) {
      return { error: 'Game already in progress' };
    }

    if (this.players.size >= 10) {
      return { error: 'Room is full' };
    }

    this._addPlayer(socketId, sessionId, name, avatarId);
    console.log(`[RapideRoom ${this.code}] Player "${name}" joined (${this.players.size} total)`);
    return { reconnected: false, player: this.players.get(sessionId) };
  }

  handleDisconnect(sessionId, socketId) {
    const player = this.players.get(sessionId);
    if (!player) return;

    if (socketId && player.socketId !== socketId) {
      return;
    }

    player.connected = false;
    console.log(`[RapideRoom ${this.code}] Player "${player.name}" disconnected.`);

    const timer = setTimeout(() => {
      console.log(`[RapideRoom ${this.code}] Player "${player.name}" removed (grace period expired)`);
      this.players.delete(sessionId);
      this._disconnectTimers.delete(sessionId);

      if (this.phase === RAPIDE_PHASES.LOBBY) {
        this.emit('room:playerList', this.code, { players: this.getPlayerList() });
      }

      if (this.players.size === 0) {
        this.emit('room:empty', this.code, {});
      }
    }, RAPIDE_TIMERS.RECONNECT_GRACE);

    this._disconnectTimers.set(sessionId, timer);
  }

  removePlayer(sessionId) {
    const player = this.players.get(sessionId);
    if (!player) return;

    if (this._disconnectTimers.has(sessionId)) {
      clearTimeout(this._disconnectTimers.get(sessionId));
      this._disconnectTimers.delete(sessionId);
    }

    this.players.delete(sessionId);
    console.log(`[RapideRoom ${this.code}] Player "${player.name}" explicitly left`);

    if (this.players.size === 0) {
      this.emit('room:empty', this.code, {});
      return;
    }

    if (player.isHost) {
      const remaining = [...this.players.values()];
      if (remaining.length > 0) {
        remaining[0].isHost = true;
        console.log(`[RapideRoom ${this.code}] Host left. New host: "${remaining[0].name}"`);
      }
    }

    this.emit('room:playerList', this.code, { players: this.getPlayerList() });
  }

  getPlayerList() {
    const list = [];
    for (const [, p] of this.players) {
      list.push({
        id: p.sessionId,
        sessionId: p.sessionId,
        socketId: p.socketId,
        name: p.name,
        pseudo: p.name,
        avatarId: p.avatarId,
        isHost: p.isHost,
        connected: p.connected,
        cards: p.cards,
        totalScore: p.totalScore,
      });
    }
    return list;
  }

  getConnectedPlayers() {
    return [...this.players.values()].filter((p) => p.connected);
  }

  getHostSessionId() {
    for (const [, p] of this.players) {
      if (p.isHost) return p.sessionId;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  THEME & DECK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  _shuffleThemes() {
    const rawList = RAPIDE_THEMES[this.language] || RAPIDE_THEMES.fr;
    this.themeDeck = [...rawList].sort(() => Math.random() - 0.5);
    this.themeIndex = -1;
  }

  _nextTheme() {
    this.themeIndex++;
    if (this.themeIndex >= this.themeDeck.length) {
      this._shuffleThemes();
      this.themeIndex = 0;
    }
    this.currentTheme = this.themeDeck[this.themeIndex];
    this.validAnswersCount = 0;

    this.emit('rapide:themeChanged', this.code, {
      theme: this.currentTheme,
      themeIndex: this.themeIndex,
      validAnswersCount: 0,
      answersNeeded: this.answersPerTheme,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CARD MANAGEMENT (WEIGHTED DEALING)
  // ═══════════════════════════════════════════════════════════════════

  _buildLetterPool() {
    const weights = this.language === 'en' ? LETTER_WEIGHTS_EN : LETTER_WEIGHTS_FR;
    const pool = [];
    for (const [letter, weight] of Object.entries(weights)) {
      // Exclude rare letters if config requests it
      if (this.excludeRareLetters && ['W', 'X', 'Y', 'Z'].includes(letter)) {
        continue;
      }
      for (let i = 0; i < weight; i++) {
        pool.push(letter);
      }
    }
    return pool;
  }

  _dealCards() {
    const pool = this._buildLetterPool();
    for (const [, player] of this.players) {
      player.cards = [];
      for (let i = 0; i < this.cardsPerPlayer; i++) {
        const randLetter = pool[Math.floor(Math.random() * pool.length)];
        player.cards.push(randLetter);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GAME FLOW METHODS
  // ═══════════════════════════════════════════════════════════════════

  startGame(requestingSessionId) {
    if (this.phase !== RAPIDE_PHASES.LOBBY) {
      return { error: 'Game is not in lobby phase' };
    }
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can start the game' };
    }
    if (this.getConnectedPlayers().length < 2) {
      return { error: 'Need at least 2 players to start' };
    }

    this.currentRound = 1;
    this.phase = RAPIDE_PHASES.PLAYING;
    this._dealCards();
    this._shuffleThemes();
    this.themeIndex = 0;
    this.currentTheme = this.themeDeck[this.themeIndex];
    this.validAnswersCount = 0;
    this.answers.clear();

    const payload = {
      playerCards: this._getPlayerCardsMap(),
      theme: this.currentTheme,
      themeIndex: this.themeIndex,
      validAnswersCount: 0,
      answersNeeded: this.answersPerTheme,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      scoreLimit: this.scoreLimit,
    };

    this.emit('rapide:gameStarted', this.code, payload);
    return { success: true };
  }

  _getPlayerCardsMap() {
    const map = {};
    for (const [sid, p] of this.players) {
      map[sid] = p.cards;
    }
    return map;
  }

  _checkRoundEnd() {
    // Round ends when any player has 0 cards left
    for (const [sid, p] of this.players) {
      if (p.cards.length === 0) {
        this._endRound(sid);
        return true;
      }
    }
    return false;
  }

  _endRound(winnerId) {
    this.phase = RAPIDE_PHASES.ROUND_SUMMARY;
    
    // Clear any active challenge timers
    for (const timer of this._challengeTimers.values()) {
      clearTimeout(timer);
    }
    this._challengeTimers.clear();

    // Calculate penalties
    const penalties = [];
    const scores = [];
    const winnerPlayer = this.players.get(winnerId);

    for (const [sid, p] of this.players) {
      const cardsLeft = p.cards.length;
      // Winner gets 0 penalty points, others get CARD_PENALTY per card left
      const penaltyPts = p.sessionId === winnerId ? 0 : cardsLeft * RAPIDE_SCORING.CARD_PENALTY;
      p.totalScore += penaltyPts;

      penalties.push({
        playerId: p.sessionId,
        pseudo: p.name,
        avatarId: p.avatarId,
        cardsLeft,
        penaltyPts,
      });

      scores.push({
        playerId: p.sessionId,
        pseudo: p.name,
        avatarId: p.avatarId,
        totalScore: p.totalScore,
      });
    }

    this.emit('rapide:roundEnded', this.code, {
      winnerId,
      winnerPseudo: winnerPlayer ? winnerPlayer.name : '',
      penalties,
      scores,
      round: this.currentRound,
    });

    // Check game-end condition
    if (this._checkGameEnd()) {
      // Auto-advance timer won't run, wait for rematch
      return;
    }

    // Auto-advance after 8 seconds
    const autoTimer = setTimeout(() => {
      this._startNextRound();
    }, RAPIDE_TIMERS.ROUND_SUMMARY_AUTO);

    this._timers.push(autoTimer);
  }

  _checkGameEnd() {
    // 1. Has anyone reached the score limit?
    let hitLimit = false;
    for (const [, p] of this.players) {
      if (p.totalScore >= this.scoreLimit) {
        hitLimit = true;
        break;
      }
    }

    // 2. Are rounds exhausted?
    const roundsExhausted = this.currentRound >= this.totalRounds;

    if (hitLimit || roundsExhausted) {
      this.phase = RAPIDE_PHASES.FINAL_SCORES;
      
      const finalLeaderboard = [...this.players.values()]
        .map(p => ({
          playerId: p.sessionId,
          pseudo: p.name,
          avatarId: p.avatarId,
          totalScore: p.totalScore,
        }))
        // Lowest score wins
        .sort((a, b) => a.totalScore - b.totalScore);

      // Assign ranks
      finalLeaderboard.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });

      const winnerId = finalLeaderboard[0] ? finalLeaderboard[0].playerId : null;

      this.emit('rapide:finalScores', this.code, {
        finalLeaderboard,
        winnerId,
      });
      return true;
    }

    return false;
  }

  _startNextRound() {
    // Cancel any round-summary timers
    this._timers.forEach(clearTimeout);
    this._timers = [];

    this.currentRound++;
    this.phase = RAPIDE_PHASES.PLAYING;
    this._dealCards();
    this._nextTheme();
    this.answers.clear();

    this.emit('rapide:newRoundStarted', this.code, {
      playerCards: this._getPlayerCardsMap(),
      theme: this.currentTheme,
      themeIndex: this.themeIndex,
      validAnswersCount: 0,
      answersNeeded: this.answersPerTheme,
      round: this.currentRound,
    });
  }

  nextRound(requestingSessionId) {
    if (this.phase !== RAPIDE_PHASES.ROUND_SUMMARY) {
      return { error: 'Not in round summary phase' };
    }
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can advance the round' };
    }

    this._startNextRound();
    return { success: true };
  }

  restartGame(requestingSessionId) {
    if (this.phase !== RAPIDE_PHASES.FINAL_SCORES) {
      return { error: 'Not in final scores phase' };
    }
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can restart' };
    }

    // Reset scores
    for (const [, p] of this.players) {
      p.totalScore = 0;
    }

    this.currentRound = 1;
    this.phase = RAPIDE_PHASES.PLAYING;
    this._dealCards();
    this._shuffleThemes();
    this.themeIndex = 0;
    this.currentTheme = this.themeDeck[this.themeIndex];
    this.validAnswersCount = 0;
    this.answers.clear();

    const payload = {
      playerCards: this._getPlayerCardsMap(),
      theme: this.currentTheme,
      themeIndex: this.themeIndex,
      validAnswersCount: 0,
      answersNeeded: this.answersPerTheme,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      scoreLimit: this.scoreLimit,
    };

    this.emit('rapide:gameStarted', this.code, payload);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ANSWER SUBMISSION & VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  _normalize(word) {
    return word
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  _validateAnswer(sessionId, word, letter) {
    const player = this.players.get(sessionId);
    if (!player) return { error: 'Player not found' };

    const L = letter.toUpperCase();

    // 1. Verify player has the card
    if (!player.cards.includes(L)) {
      return { error: 'no_card' };
    }

    // 2. Word starts with selected letter
    const normalized = this._normalize(word);
    if (!normalized.startsWith(L)) {
      return { error: 'wrong_letter' };
    }

    // 3. Prevent duplicate answers in the current theme
    for (const [, a] of this.answers) {
      if (
        a.themeIndex === this.themeIndex &&
        a.status === 'accepted' &&
        this._normalize(a.word) === normalized
      ) {
        return { error: 'duplicate' };
      }
    }

    return { ok: true };
  }

  submitAnswer(sessionId, word, letter) {
    if (this.phase !== RAPIDE_PHASES.PLAYING) {
      return { error: 'Game is not playing' };
    }

    const player = this.players.get(sessionId);
    if (!player) return { error: 'Player not found' };

    const check = this._validateAnswer(sessionId, word, letter);
    if (check.error) {
      return { error: check.error };
    }

    // Temporarily take the card from the player hand (will return if rejected)
    const cardIdx = player.cards.indexOf(letter.toUpperCase());
    if (cardIdx !== -1) {
      player.cards.splice(cardIdx, 1);
    }

    // Create answer object
    const answerId = `${sessionId}_${Date.now()}`;
    const answer = {
      id: answerId,
      sessionId,
      pseudo: player.name,
      avatarId: player.avatarId,
      word,
      letter: letter.toUpperCase(),
      themeIndex: this.themeIndex,
      status: 'pending',
      submittedAt: Date.now(),
      challengerId: null,
      votes: new Map(),
    };

    this.answers.set(answerId, answer);

    // Broadcast to room
    this.emit('rapide:answerSubmitted', this.code, {
      answerId,
      playerId: sessionId,
      pseudo: player.name,
      avatarId: player.avatarId,
      word,
      letter: letter.toUpperCase(),
      status: 'pending',
    });

    // Start 3-second auto-accept challenge window
    const challengeTimer = setTimeout(() => {
      this._acceptAnswer(answerId);
    }, RAPIDE_TIMERS.CHALLENGE_WINDOW);

    this._challengeTimers.set(answerId, challengeTimer);

    return { success: true };
  }

  _acceptAnswer(answerId) {
    const answer = this.answers.get(answerId);
    if (!answer || answer.status !== 'pending') return;

    answer.status = 'accepted';
    this._challengeTimers.delete(answerId);

    const player = this.players.get(answer.sessionId);
    this.validAnswersCount++;

    this.emit('rapide:answerAccepted', this.code, {
      answerId,
      playerId: answer.sessionId,
      cardsRemaining: player ? player.cards.length : 0,
      playerCards: player ? player.cards : [],
      validAnswersCount: this.validAnswersCount,
    });

    // Check round end
    if (this._checkRoundEnd()) {
      return;
    }

    // If theme reached max valid answers, advance theme
    if (this.validAnswersCount >= this.answersPerTheme) {
      this._nextTheme();
    }
  }

  _rejectAnswer(answerId, reason) {
    const answer = this.answers.get(answerId);
    if (!answer) return;

    answer.status = 'rejected';
    this._challengeTimers.delete(answerId);

    // Give card back to player
    const player = this.players.get(answer.sessionId);
    if (player) {
      player.cards.push(answer.letter);
    }

    this.emit('rapide:answerRejected', this.code, {
      answerId,
      playerId: answer.sessionId,
      letter: answer.letter,
      reason,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CHALLENGE & VOTING FLOW
  // ═══════════════════════════════════════════════════════════════════

  challengeAnswer(challengerId, answerId) {
    if (this.phase !== RAPIDE_PHASES.PLAYING) {
      return { error: 'Game is not playing' };
    }

    const answer = this.answers.get(answerId);
    if (!answer || answer.status !== 'pending') {
      return { error: 'Answer is no longer challengeable' };
    }

    // Cancel auto-accept timer
    if (this._challengeTimers.has(answerId)) {
      clearTimeout(this._challengeTimers.get(answerId));
      this._challengeTimers.delete(answerId);
    }

    answer.status = 'challenged';
    answer.challengerId = challengerId;

    this.emit('rapide:challengeStarted', this.code, {
      answerId,
      challengerId,
      word: answer.word,
      letter: answer.letter,
      timeoutMs: RAPIDE_TIMERS.VOTE_TIMEOUT,
    });

    // Start hard vote timeout
    const voteTimeout = setTimeout(() => {
      this._resolveChallenge(answerId);
    }, RAPIDE_TIMERS.VOTE_TIMEOUT);

    this._challengeTimers.set(answerId, voteTimeout);

    return { success: true };
  }

  castVote(voterId, answerId, accept) {
    const answer = this.answers.get(answerId);
    if (!answer || answer.status !== 'challenged') {
      return { error: 'No active challenge vote for this answer' };
    }

    // Record vote
    answer.votes.set(voterId, accept);

    // Calculate accept/reject counts
    let acceptVotes = 0;
    let rejectVotes = 0;
    for (const v of answer.votes.values()) {
      if (v) acceptVotes++;
      else rejectVotes++;
    }

    this.emit('rapide:challengeVoteUpdate', this.code, {
      answerId,
      acceptVotes,
      rejectVotes,
      totalVoters: this.getConnectedPlayers().length,
    });

    // If everyone (excluding the owner) has voted, resolve immediately
    const votersNeeded = this.getConnectedPlayers().length - 1; // can't vote on your own answer
    const activeVoters = [...answer.votes.keys()].filter(id => id !== answer.sessionId);

    if (activeVoters.length >= Math.max(1, votersNeeded)) {
      this._resolveChallenge(answerId);
    }

    return { success: true };
  }

  _resolveChallenge(answerId) {
    const answer = this.answers.get(answerId);
    if (!answer || answer.status !== 'challenged') return;

    if (this._challengeTimers.has(answerId)) {
      clearTimeout(this._challengeTimers.get(answerId));
      this._challengeTimers.delete(answerId);
    }

    let acceptVotes = 0;
    let rejectVotes = 0;
    for (const [voterId, accept] of answer.votes.entries()) {
      // Exclude author's own vote if they managed to cast one
      if (voterId === answer.sessionId) continue;
      if (accept) acceptVotes++;
      else rejectVotes++;
    }

    if (rejectVotes > acceptVotes) {
      // Rejected by majority
      this._rejectAnswer(answerId, 'vote_rejected');
    } else {
      // Accepted (ties favor acceptance)
      // Transition back to pending but then immediately accept it
      answer.status = 'pending';
      this._acceptAnswer(answerId);
    }
  }

  skipTheme(sessionId) {
    if (this.phase !== RAPIDE_PHASES.PLAYING) {
      return { error: 'Game is not playing' };
    }
    if (sessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can skip theme' };
    }

    this._nextTheme();
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  RECONNECTION STATE SUPPORT
  // ═══════════════════════════════════════════════════════════════════

  _getRecentAnswers(limit = 10) {
    return [...this.answers.values()]
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, limit)
      .map(a => ({
        answerId: a.id,
        playerId: a.sessionId,
        pseudo: a.pseudo,
        avatarId: a.avatarId,
        word: a.word,
        letter: a.letter,
        status: a.status,
      }));
  }

  getState() {
    return {
      code: this.code,
      gameMode: 'rapide',
      phase: this.phase,
      config: {
        gameMode: 'rapide',
        language: this.language,
        cardsPerPlayer: this.cardsPerPlayer,
        answersPerTheme: this.answersPerTheme,
        scoreLimit: this.scoreLimit,
        rounds: this.totalRounds,
      },
      players: this.getPlayerList(),
      theme: this.currentTheme,
      themeIndex: this.themeIndex,
      validAnswersCount: this.validAnswersCount,
      answersNeeded: this.answersPerTheme,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      recentAnswers: this._getRecentAnswers(10),
    };
  }

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    for (const timer of this._challengeTimers.values()) {
      clearTimeout(timer);
    }
    this._challengeTimers.clear();
    for (const timer of this._disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this._disconnectTimers.clear();
  }
}

module.exports = RapideRoom;
