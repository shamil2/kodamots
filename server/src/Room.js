const { PHASES, TIMERS, SCORING, ALPHABET_FULL, RARE_LETTERS, CATEGORIES } = require('./constants');
const dictionaryService = require('./DictionaryService');
const { areSimilarWords } = require('./similarity');

class Room {
  /**
   * @param {string} code          – 4-char room code
   * @param {string} hostSocketId  – socket id of the creator
   * @param {string} hostSessionId – persistent session id
   * @param {string} hostName      – display name
   * @param {object} config        – { language, categories, rounds, excludeRareLetters }
   * @param {Function} emit        – (eventName, roomCode, payload) broadcaster
   */
  constructor(code, hostSocketId, hostSessionId, hostName, hostAvatarId, config, emit) {
    this.code = code;
    this.emit = emit;

    // ─── Configuration ──────────────────────────────────────────────
    this.language = config.language || 'fr';
    this.categories = config.categories || CATEGORIES[this.language] || CATEGORIES.fr;
    this.totalRounds = Math.min(Math.max(config.rounds || 3, 1), 10);
    this.excludeRareLetters = config.excludeRareLetters !== false;

    // Build available letters
    this.availableLetters = this.excludeRareLetters
      ? ALPHABET_FULL.filter((l) => !RARE_LETTERS.includes(l))
      : [...ALPHABET_FULL];
    this.usedLetters = [];

    // ─── State ──────────────────────────────────────────────────────
    this.phase = PHASES.LOBBY;
    this.currentRound = 0;
    this.currentLetter = null;
    this.speedPresserId = null; // sessionId of the player who hit SPEED

    // ─── Players ────────────────────────────────────────────────────
    // Map<sessionId, PlayerObject>
    this.players = new Map();

    // ─── Answers & Votes ────────────────────────────────────────────
    // Map<sessionId, { [category]: string }>
    this.answers = new Map();
    // Map<`${voterSessionId}:${targetSessionId}:${category}`, boolean>
    this.votes = new Map();
    // Set<sessionId> – players who finished voting
    this.votingComplete = new Set();

    // ─── Scores ─────────────────────────────────────────────────────
    // Map<sessionId, number>  cumulative
    this.totalScores = new Map();

    this._addPlayer(hostSocketId, hostSessionId, hostName, hostAvatarId, true);

    // ─── Timers ─────────────────────────────────────────────────────
    this._timers = [];

    // ─── Disconnect grace tracking ──────────────────────────────────
    // Map<sessionId, timeoutId>
    this._disconnectTimers = new Map();

    console.log(`[Room ${this.code}] Created by "${hostName}" (${hostSessionId}). Language=${this.language}, Rounds=${this.totalRounds}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PLAYER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  _addPlayer(socketId, sessionId, name, avatarId, isHost = false) {
    this.players.set(sessionId, {
      socketId,
      sessionId,
      name: name || `Player${this.players.size + 1}`,
      avatarId: avatarId || null,
      isHost,
      connected: true,
    });
    if (!this.totalScores.has(sessionId)) {
      this.totalScores.set(sessionId, 0);
    }
  }

  addPlayer(socketId, sessionId, name, avatarId) {
    // Reconnection check
    if (this.players.has(sessionId)) {
      const player = this.players.get(sessionId);
      player.socketId = socketId;
      player.connected = true;

      // Clear disconnect timer
      if (this._disconnectTimers.has(sessionId)) {
        clearTimeout(this._disconnectTimers.get(sessionId));
        this._disconnectTimers.delete(sessionId);
        console.log(`[Room ${this.code}] Player "${player.name}" reconnected`);
      }

      return { reconnected: true, player };
    }

    if (this.phase !== PHASES.LOBBY) {
      return { error: 'Game already in progress' };
    }

    if (this.players.size >= 10) {
      return { error: 'Room is full' };
    }

    this._addPlayer(socketId, sessionId, name, avatarId);
    console.log(`[Room ${this.code}] Player "${name}" joined (${this.players.size} total)`);
    return { reconnected: false, player: this.players.get(sessionId) };
  }

  handleDisconnect(sessionId, socketId) {
    const player = this.players.get(sessionId);
    if (!player) return;

    if (socketId && player.socketId !== socketId) {
      console.log(`[Room ${this.code}] Ignoring disconnect for stale socket ${socketId} (active is ${player.socketId})`);
      return;
    }

    player.connected = false;
    console.log(`[Room ${this.code}] Player "${player.name}" disconnected. Starting ${TIMERS.RECONNECT_GRACE_PERIOD / 1000}s grace period.`);

    const timer = setTimeout(() => {
      console.log(`[Room ${this.code}] Player "${player.name}" removed (grace period expired)`);
      this.players.delete(sessionId);
      this._disconnectTimers.delete(sessionId);
      this.totalScores.delete(sessionId);

      // If in lobby, broadcast updated player list
      if (this.phase === PHASES.LOBBY) {
        this.emit('room:playerList', this.code, { players: this.getPlayerList() });
      }

      // If all players left, mark room for cleanup
      if (this.players.size === 0) {
        this.emit('room:empty', this.code, {});
      }
    }, TIMERS.RECONNECT_GRACE_PERIOD);

    this._disconnectTimers.set(sessionId, timer);
  }

  removePlayer(sessionId) {
    const player = this.players.get(sessionId);
    if (!player) return;

    if (this._disconnectTimers.has(sessionId)) {
      clearTimeout(this._disconnectTimers.get(sessionId));
      this._disconnectTimers.delete(sessionId);
    }

    console.log(`[Room ${this.code}] Player "${player.name}" explicitly left the room`);
    this.players.delete(sessionId);
    this.totalScores.delete(sessionId);

    // If the room is empty, notify to destroy it
    if (this.players.size === 0) {
      this.emit('room:empty', this.code, {});
      return;
    }

    // If the host left, assign a new host
    if (player.isHost) {
      const remainingPlayers = [...this.players.values()];
      if (remainingPlayers.length > 0) {
        remainingPlayers[0].isHost = true;
        console.log(`[Room ${this.code}] Host left. New host assigned: "${remainingPlayers[0].name}"`);
      }
    }

    // Broadcast updated player list
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
        avatarId: p.avatarId || null,
        isHost: p.isHost,
        connected: p.connected,
        score: this.totalScores.get(p.sessionId) || 0,
        totalScore: this.totalScores.get(p.sessionId) || 0,
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
  //  GAME FLOW
  // ═══════════════════════════════════════════════════════════════════

  startGame(requestingSessionId) {
    if (this.phase !== PHASES.LOBBY) {
      return { error: 'Game is not in lobby phase' };
    }
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can start the game' };
    }
    if (this.getConnectedPlayers().length < 2) {
      return { error: 'Need at least 2 players to start' };
    }

    console.log(`[Room ${this.code}] Game starting! ${this.totalRounds} rounds, ${this.getConnectedPlayers().length} players`);
    this._startNextRound();
    return { success: true };
  }

  nextRound(requestingSessionId) {
    if (this.phase !== PHASES.SCORES) {
      return { error: 'Game is not in scores phase' };
    }
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can start the next round' };
    }
    if (this.currentRound >= this.totalRounds) {
      return { error: 'Game is already finished. No more rounds.' };
    }

    // Start a 3-second countdown
    let count = 3;
    this.emit('game:nextRoundCountdown', this.code, { seconds: count });

    const intervalId = setInterval(() => {
      count--;
      if (count > 0) {
        this.emit('game:nextRoundCountdown', this.code, { seconds: count });
      } else {
        clearInterval(intervalId);
        this._timers = this._timers.filter((id) => id !== intervalId);
        this._startNextRound();
      }
    }, 1000);

    this._timers.push(intervalId);
    return { success: true };
  }

  _startNextRound() {
    this.currentRound++;
    this.speedPresserId = null;
    this.answers.clear();
    this.votes.clear();
    this.votingComplete.clear();

    // Pick a random letter
    this.currentLetter = this._pickLetter();
    this.phase = PHASES.LETTER_SPIN;

    console.log(`[Room ${this.code}] Round ${this.currentRound}/${this.totalRounds} — Letter: ${this.currentLetter}`);

    this.emit('game:letterSpin', this.code, {
      letter: this.currentLetter,
      round: this.currentRound,
      totalRounds: this.totalRounds,
    });

    // After spin animation, move to INPUT phase
    this._setTimer(() => {
      this.phase = PHASES.INPUT;
      this.emit('game:inputPhase', this.code, {
        categories: this.categories,
        letter: this.currentLetter,
        round: this.currentRound,
      });
    }, TIMERS.LETTER_SPIN_DURATION);
  }

  _pickLetter() {
    // Remove already-used letters from the pool
    let pool = this.availableLetters.filter((l) => !this.usedLetters.includes(l));

    // If all used, reset
    if (pool.length === 0) {
      this.usedLetters = [];
      pool = [...this.availableLetters];
    }

    const letter = pool[Math.floor(Math.random() * pool.length)];
    this.usedLetters.push(letter);
    return letter;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SUBMIT ANSWERS
  // ═══════════════════════════════════════════════════════════════════

  submitAnswers(sessionId, answers) {
    if (this.phase !== PHASES.INPUT && this.phase !== PHASES.COUNTDOWN) {
      return { error: 'Not accepting answers right now' };
    }
    if (!this.players.has(sessionId)) {
      return { error: 'Player not in this room' };
    }

    // Sanitize answers — only keep valid categories, trim whitespace
    const sanitized = {};
    for (const cat of this.categories) {
      const val = answers[cat];
      sanitized[cat] = (typeof val === 'string') ? val.trim() : '';
    }

    this.answers.set(sessionId, sanitized);
    console.log(`[Room ${this.code}] Answers received from "${this.players.get(sessionId).name}"`);

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SPEED BUTTON
  // ═══════════════════════════════════════════════════════════════════

  handleSpeedPressed(sessionId) {
    if (this.phase !== PHASES.INPUT) {
      return { error: 'Speed can only be pressed during input phase' };
    }
    if (!this.players.has(sessionId)) {
      return { error: 'Player not in this room' };
    }
    if (this.speedPresserId) {
      return { error: 'Speed already pressed by another player' };
    }

    // Check that the player has filled ALL categories
    const playerAnswers = this.answers.get(sessionId);
    if (!playerAnswers) {
      return { error: 'You must submit your answers before pressing SPEED' };
    }
    const allFilled = this.categories.every((cat) => playerAnswers[cat] && playerAnswers[cat].length > 0);
    if (!allFilled) {
      return { error: 'All fields must be filled to press SPEED' };
    }

    this.speedPresserId = sessionId;
    this.phase = PHASES.COUNTDOWN;

    console.log(`[Room ${this.code}] SPEED pressed by "${this.players.get(sessionId).name}" — 5s countdown!`);

    // Run active countdown loop on server so client receives ticks every second
    let secondsLeft = 5;
    const tick = () => {
      if (this.phase !== PHASES.COUNTDOWN) return;
      this.emit('game:countdown', this.code, {
        seconds: secondsLeft,
        triggeredBy: this.players.get(sessionId)?.name || '',
      });
      if (secondsLeft <= 0) {
        this.emit('game:inputsLocked', this.code, {});
        this._lockAndStartVoting();
      } else {
        secondsLeft--;
        this._setTimer(tick, 1000);
      }
    };
    tick();

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  VOTING PHASE
  // ═══════════════════════════════════════════════════════════════════

  _lockAndStartVoting() {
    // Keep phase as PHASES.COUNTDOWN for a 1.5 second buffer
    // so late answers coming over the network are still accepted by submitAnswers()
    this._setTimer(() => {
      this.phase = PHASES.VOTING;

      // For players who didn't submit answers, set empty answers
      for (const [sessionId] of this.players) {
        if (!this.answers.has(sessionId)) {
          const empty = {};
          for (const cat of this.categories) empty[cat] = '';
          this.answers.set(sessionId, empty);
        }
      }

      // Build votingData list as expected by React Client
      const votingData = this.getVotingData();

      console.log(`[Room ${this.code}] Voting phase started with ${votingData.length} cards`);

      this.emit('vote:start', this.code, {
        votingData,
      });

      // Safety timeout for voting phase
      this._setTimer(() => {
        if (this.phase === PHASES.VOTING) {
          console.log(`[Room ${this.code}] Voting timed out, calculating scores`);
          this._calculateScores();
        }
      }, TIMERS.VOTE_TIMEOUT);
    }, 1500);
  }

  /**
   * A player casts a vote on another player's answer.
   * @param {string} voterSessionId
   * @param {string} targetSessionId  – the player whose answer is being voted on
   * @param {string} category
   * @param {boolean} valid           – true = accept, false = reject
   */
  castVote(voterSessionId, targetSessionId, category, valid) {
    if (this.phase !== PHASES.VOTING) {
      return { error: 'Not in voting phase' };
    }
    if (!this.players.has(voterSessionId)) {
      return { error: 'Voter not in room' };
    }
    if (voterSessionId === targetSessionId) {
      return { error: 'Cannot vote on your own answers' };
    }
    if (!this.categories.includes(category)) {
      return { error: 'Invalid category' };
    }

    const key = `${voterSessionId}:${targetSessionId}:${category}`;
    this.votes.set(key, valid);

    return { success: true };
  }

  /**
   * A player signals they've finished voting on all answers.
   */
  finishVoting(sessionId) {
    if (this.phase !== PHASES.VOTING) {
      return { error: 'Not in voting phase' };
    }

    this.votingComplete.add(sessionId);
    console.log(`[Room ${this.code}] "${this.players.get(sessionId)?.name}" finished voting (${this.votingComplete.size}/${this.getConnectedPlayers().length})`);

    // Check if all connected players are done
    const connected = this.getConnectedPlayers();
    const allDone = connected.every((p) => this.votingComplete.has(p.sessionId));

    if (allDone) {
      console.log(`[Room ${this.code}] All players voted — calculating scores`);
      this._calculateScores();
    }

    return { success: true, allDone };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SCORING
  // ═══════════════════════════════════════════════════════════════════

  _calculateScores() {
    this._clearTimers();
    this.phase = PHASES.SCORES;

    const roundScores = {};       // { sessionId: { total, details: { [cat]: { word, points, status } } } }
    const connectedPlayers = this.getConnectedPlayers();
    const connectedIds = connectedPlayers.map((p) => p.sessionId);

    // First pass: determine validity via majority vote for each answer
    const validity = new Map(); // `${sessionId}:${category}` → boolean

    for (const [targetSessionId, answers] of this.answers) {
      for (const category of this.categories) {
        const word = answers[category] || '';
        const key = `${targetSessionId}:${category}`;

        // Empty answer = invalid
        if (!word) {
          validity.set(key, false);
          continue;
        }

        // Count votes from other players
        let yesVotes = 0;
        let totalVotes = 0;

        for (const voter of connectedIds) {
          if (voter === targetSessionId) continue;
          const voteKey = `${voter}:${targetSessionId}:${category}`;
          if (this.votes.has(voteKey)) {
            totalVotes++;
            if (this.votes.get(voteKey)) yesVotes++;
          }
        }

        // If no one voted on this answer, default to valid
        // Majority rules; tie = valid
        const isValid = totalVotes === 0 ? true : (yesVotes >= totalVotes / 2);
        validity.set(key, isValid);
      }
    }

    // Second pass: detect shared/duplicate answers (same/similar word by multiple players for the same category)
    for (const [targetSessionId] of this.answers) {
      roundScores[targetSessionId] = { total: 0, details: {} };
    }

    for (const category of this.categories) {
      // Group answers by similar words using clustering
      const clusters = []; // Array of { representative: string, playerIds: string[] }

      for (const [sessionId, answers] of this.answers) {
        const word = answers[category] || '';
        if (word && word.trim()) {
          let added = false;
          for (const cluster of clusters) {
            if (areSimilarWords(cluster.representative, word)) {
              cluster.playerIds.push(sessionId);
              added = true;
              break;
            }
          }
          if (!added) {
            clusters.push({
              representative: word,
              playerIds: [sessionId],
            });
          }
        }
      }

      // Score each player for this category
      for (const [sessionId, answers] of this.answers) {
        const word = answers[category] || '';
        const vKey = `${sessionId}:${category}`;
        const isValid = validity.get(vKey);

        let points = SCORING.INVALID;
        let status = 'invalid';

        if (!word || !word.trim()) {
          points = SCORING.EMPTY;
          status = 'empty';
        } else if (!isValid) {
          points = SCORING.INVALID;
          status = 'invalid';
        } else {
          // Find the cluster this word belongs to
          const cluster = clusters.find((c) => c.playerIds.includes(sessionId));

          // Only count valid answers in the cluster for sharing/duplicate detection
          const validSameWord = cluster
            ? cluster.playerIds.filter((sid) => validity.get(`${sid}:${category}`))
            : [sessionId];

          if (validSameWord.length > 1) {
            points = SCORING.VALID_SHARED;
            status = 'shared';
          } else {
            points = SCORING.VALID_UNIQUE;
            status = 'unique';
          }
        }

        roundScores[sessionId].details[category] = { word, points, status };
        roundScores[sessionId].total += points;
      }
    }

    // SPEED bonus: +2 if the speed presser has ALL answers validated
    let speedBonusAwarded = false;
    if (this.speedPresserId && roundScores[this.speedPresserId]) {
      const presserDetails = roundScores[this.speedPresserId].details;
      const allValid = this.categories.every((cat) => {
        const d = presserDetails[cat];
        return d && (d.status === 'unique' || d.status === 'shared');
      });
      if (allValid) {
        roundScores[this.speedPresserId].total += SCORING.SPEED_BONUS;
        speedBonusAwarded = true;
        console.log(`[Room ${this.code}] SPEED bonus +${SCORING.SPEED_BONUS} awarded to "${this.players.get(this.speedPresserId)?.name}"`);
      }
    }

    // Update cumulative scores
    for (const [sessionId, score] of Object.entries(roundScores)) {
      const current = this.totalScores.get(sessionId) || 0;
      this.totalScores.set(sessionId, current + score.total);
    }

    // Build client-compatible round scores details
    const categoriesScores = this.categories.map((category) => {
      const entries = [];
      for (const [playerId, playerAnswers] of this.answers) {
        const wordDetails = roundScores[playerId]?.details[category];
        entries.push({
          pseudo: this.players.get(playerId)?.name || '',
          answer: wordDetails?.word || '',
          valid: wordDetails ? (wordDetails.status === 'unique' || wordDetails.status === 'shared') : false,
          points: wordDetails?.points || 0,
        });
      }
      return {
        name: category,
        entries,
      };
    });

    let speedBonus = null;
    if (speedBonusAwarded && this.speedPresserId) {
      speedBonus = {
        pseudo: this.players.get(this.speedPresserId)?.name || '',
        points: SCORING.SPEED_BONUS,
      };
    }

    const clientScores = {
      categories: categoriesScores,
      speedBonus,
    };

    // Build leaderboard
    const clientLeaderboard = this.getPlayerList()
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.sessionId,
        pseudo: p.name,
        avatarId: p.avatarId || null,
        totalScore: p.score,
      }));

    console.log(`[Room ${this.code}] Round ${this.currentRound} scores calculated`);

    this.emit('score:roundResults', this.code, {
      scores: clientScores,
      leaderboard: clientLeaderboard,
      round: this.currentRound,
    });

    // If final round, transition to final scores automatically. Otherwise, wait for host manual trigger.
    if (this.currentRound >= this.totalRounds) {
      this._setTimer(() => {
        this._showFinalScores();
      }, TIMERS.SCORE_DISPLAY_DURATION);
    }
  }

  _showFinalScores() {
    this.phase = PHASES.FINAL_SCORES;

    const clientFinalLeaderboard = this.getPlayerList()
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        playerId: p.sessionId,
        pseudo: p.name,
        avatarId: p.avatarId || null,
        totalScore: p.score,
        rank: i + 1
      }));

    console.log(`[Room ${this.code}] Game over! Final leaderboard:`);
    clientFinalLeaderboard.forEach((p) => console.log(`  #${p.rank} ${p.pseudo}: ${p.totalScore}pts`));

    this.emit('score:finalResults', this.code, {
      finalLeaderboard: clientFinalLeaderboard,
    });
  }

  /**
   * Host can restart the game (back to lobby).
   */
  restartGame(requestingSessionId) {
    if (requestingSessionId !== this.getHostSessionId()) {
      return { error: 'Only the host can restart' };
    }

    this._clearTimers();
    this.phase = PHASES.LOBBY;
    this.currentRound = 0;
    this.currentLetter = null;
    this.speedPresserId = null;
    this.usedLetters = [];
    this.answers.clear();
    this.votes.clear();
    this.votingComplete.clear();

    // Reset scores
    for (const [sessionId] of this.totalScores) {
      this.totalScores.set(sessionId, 0);
    }

    console.log(`[Room ${this.code}] Game restarted, back to lobby`);
    this.emit('room:playerList', this.code, {
      players: this.getPlayerList(),
    });

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TIMER HELPERS
  // ═══════════════════════════════════════════════════════════════════

  _setTimer(callback, duration) {
    const id = setTimeout(() => {
      this._timers = this._timers.filter((t) => t !== id);
      callback();
    }, duration);
    this._timers.push(id);
    return id;
  }

  _clearTimers() {
    for (const id of this._timers) {
      clearTimeout(id);
    }
    this._timers = [];
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════════════════════

  destroy() {
    this._clearTimers();
    for (const [, timerId] of this._disconnectTimers) {
      clearTimeout(timerId);
    }
    this._disconnectTimers.clear();
    console.log(`[Room ${this.code}] Destroyed`);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SERIALIZATION (for reconnection state sync)
  // ═══════════════════════════════════════════════════════════════════

  getVotingData() {
    const votingData = [];
    for (const category of this.categories) {
      for (const [playerId, playerAnswers] of this.answers) {
        const answer = playerAnswers[category] || '';
        if (answer.trim()) {
          votingData.push({
            id: `${playerId}:${category}`,
            category,
            pseudo: this.players.get(playerId)?.name || '',
            answer,
            playerId,
          });
        }
      }
    }
    return votingData;
  }

  getState() {
    return {
      code: this.code,
      phase: this.phase,
      language: this.language,
      categories: this.categories,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      currentLetter: this.currentLetter,
      speedPresserId: this.speedPresserId,
      players: this.getPlayerList(),
    };
  }
}

module.exports = Room;
