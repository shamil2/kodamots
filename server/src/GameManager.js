const Room = require('./Room');
const RapideRoom = require('./RapideRoom');
const { ROOM } = require('./constants');

class GameManager {
  constructor() {
    // Map<roomCode, Room|RapideRoom>
    this.rooms = new Map();
    // Map<sessionId, roomCode>  – quick lookup: which room is a player in?
    this.playerRoomMap = new Map();
    // io instance – set after server boots
    this.io = null;
  }

  /**
   * Bind the Socket.io server instance.
   */
  setIO(io) {
    this.io = io;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ROOM CODE GENERATION
  // ═══════════════════════════════════════════════════════════════════

  _generateCode() {
    let code;
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < ROOM.CODE_LENGTH; i++) {
        code += ROOM.CODE_CHARS.charAt(Math.floor(Math.random() * ROOM.CODE_CHARS.length));
      }
      attempts++;
      if (attempts > 100) {
        throw new Error('Unable to generate unique room code');
      }
    } while (this.rooms.has(code));
    return code;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  BROADCAST HELPER
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Emit an event to everyone in a room.
   * Also handles the special 'room:empty' event to clean up.
   */
  _emitToRoom(eventName, roomCode, payload) {
    if (eventName === 'room:empty') {
      console.log(`[GameManager] Room ${roomCode} is empty — cleaning up`);
      this._destroyRoom(roomCode);
      return;
    }

    if (this.io) {
      this.io.to(roomCode).emit(eventName, payload);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE / JOIN / LEAVE
  // ═══════════════════════════════════════════════════════════════════

  createRoom(socketId, sessionId, playerName, playerAvatarId, config) {
    // If player is in another room, disconnect them from it first
    if (this.playerRoomMap.has(sessionId)) {
      const existingCode = this.playerRoomMap.get(sessionId);
      const existingRoom = this.rooms.get(existingCode);
      if (existingRoom) {
        existingRoom.handleDisconnect(sessionId);
      }
      this.playerRoomMap.delete(sessionId);
    }

    const code = this._generateCode();
    const gameMode = config?.gameMode || 'petit_bac';
    let room;
    
    if (gameMode === 'rapide') {
      room = new RapideRoom(
        code,
        socketId,
        sessionId,
        playerName,
        playerAvatarId || null,
        config || {},
        this._emitToRoom.bind(this)
      );
    } else {
      room = new Room(
        code,
        socketId,
        sessionId,
        playerName,
        playerAvatarId || null,
        config || {},
        this._emitToRoom.bind(this)
      );
    }

    this.rooms.set(code, room);
    this.playerRoomMap.set(sessionId, code);

    console.log(`[GameManager] Room ${code} created (Mode: ${gameMode}). Total rooms: ${this.rooms.size}`);
    return { code, room };
  }

  joinRoom(socketId, sessionId, playerName, playerAvatarId, roomCode) {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { error: 'Room not found' };
    }

    // If the player is already mapped to another room, remove from old
    if (this.playerRoomMap.has(sessionId) && this.playerRoomMap.get(sessionId) !== code) {
      const oldCode = this.playerRoomMap.get(sessionId);
      const oldRoom = this.rooms.get(oldCode);
      if (oldRoom) {
        oldRoom.handleDisconnect(sessionId);
      }
    }

    const result = room.addPlayer(socketId, sessionId, playerName, playerAvatarId || null);
    if (result.error) {
      return { error: result.error };
    }

    this.playerRoomMap.set(sessionId, code);
    return { code, room, reconnected: result.reconnected };
  }

  leaveRoom(sessionId) {
    const code = this.playerRoomMap.get(sessionId);
    if (!code) return { success: true };

    const room = this.rooms.get(code);
    if (room) {
      room.removePlayer(sessionId);
    }

    this.playerRoomMap.delete(sessionId);
    return { success: true };
  }

  handleDisconnect(sessionId, socketId) {
    const code = this.playerRoomMap.get(sessionId);
    if (!code) return;

    const room = this.rooms.get(code);
    if (!room) {
      this.playerRoomMap.delete(sessionId);
      return;
    }

    room.handleDisconnect(sessionId, socketId);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GAME ACTIONS (delegate to Room)
  // ═══════════════════════════════════════════════════════════════════

  startGame(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.startGame(sessionId);
  }

  nextRound(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.nextRound(sessionId);
  }

  submitAnswers(sessionId, answers) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.submitAnswers(sessionId, answers);
  }

  handleSpeedPressed(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.handleSpeedPressed(sessionId);
  }

  castVote(sessionId, targetSessionId, category, valid) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.castVote(sessionId, targetSessionId, category, valid);
  }

  finishVoting(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.finishVoting(sessionId);
  }

  restartGame(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a room' };
    return room.restartGame(sessionId);
  }

  getRoomState(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room) return null;
    return room.getState();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  RAPIDE MODE ACTIONS (delegate to RapideRoom)
  // ═══════════════════════════════════════════════════════════════════

  rapideSubmitAnswer(sessionId, word, letter) {
    const room = this._getRapideRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a Rapide room' };
    return room.submitAnswer(sessionId, word, letter);
  }

  rapideChallengeAnswer(sessionId, answerId) {
    const room = this._getRapideRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a Rapide room' };
    return room.challengeAnswer(sessionId, answerId);
  }

  rapideCastVote(sessionId, answerId, accept) {
    const room = this._getRapideRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a Rapide room' };
    return room.castVote(sessionId, answerId, accept);
  }

  rapideSkipTheme(sessionId) {
    const room = this._getRapideRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a Rapide room' };
    return room.skipTheme(sessionId);
  }

  rapideNextRound(sessionId) {
    const room = this._getRapideRoomForPlayer(sessionId);
    if (!room) return { error: 'You are not in a Rapide room' };
    return room.nextRound(sessionId);
  }

  _getRapideRoomForPlayer(sessionId) {
    const room = this._getRoomForPlayer(sessionId);
    if (!room || !(room instanceof RapideRoom)) return null;
    return room;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════

  _getRoomForPlayer(sessionId) {
    const code = this.playerRoomMap.get(sessionId);
    if (!code) return null;
    return this.rooms.get(code) || null;
  }

  _destroyRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      room.destroy();
      // Clean up player → room mappings
      for (const [sessionId, roomCode] of this.playerRoomMap) {
        if (roomCode === code) {
          this.playerRoomMap.delete(sessionId);
        }
      }
      this.rooms.delete(code);
      console.log(`[GameManager] Room ${code} destroyed. Total rooms: ${this.rooms.size}`);
    }
  }

  /**
   * Get stats for monitoring/debugging.
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerRoomMap.size,
      rooms: [...this.rooms.entries()].map(([code, room]) => ({
        code,
        phase: room.phase,
        playerCount: room.players.size,
        round: `${room.currentRound}/${room.totalRounds}`,
      })),
    };
  }
}

module.exports = new GameManager();
