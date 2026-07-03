const test = require('node:test');
const assert = require('node:assert');
const RapideRoom = require('../src/RapideRoom');

test('RapideRoom Lifecycle & Rules', async (t) => {
  // Mock broadcaster
  const events = [];
  const emit = (eventName, code, payload) => {
    events.push({ eventName, code, payload });
  };

  const config = {
    language: 'fr',
    cardsPerPlayer: 5,
    answersPerTheme: 2,
    scoreLimit: 40,
    rounds: 3,
    excludeRareLetters: true,
  };

  const room = new RapideRoom('ABCD', 'socket_host', 'host_session', 'Host Pseudo', 'avatar_fox', config, emit);

  await t.test('Initial State', () => {
    assert.strictEqual(room.code, 'ABCD');
    assert.strictEqual(room.phase, 'LOBBY');
    assert.strictEqual(room.players.size, 1);
    assert.strictEqual(room.getPlayerList().length, 1);
    assert.strictEqual(room.players.get('host_session').isHost, true);
  });

  await t.test('Player joins and leaves', () => {
    const joinRes = room.addPlayer('socket_guest', 'guest_session', 'Guest Pseudo', 'avatar_raccoon');
    assert.strictEqual(joinRes.reconnected, false);
    assert.strictEqual(room.players.size, 2);

    // Try joining when in LOBBY with existing session
    const reconnRes = room.addPlayer('socket_guest_new', 'guest_session', 'Guest Pseudo', 'avatar_raccoon');
    assert.strictEqual(reconnRes.reconnected, true);
    assert.strictEqual(room.players.get('guest_session').socketId, 'socket_guest_new');
  });

  await t.test('Cannot start game with 1 player, but can with 2', () => {
    // Temp remove guest to test < 2 check
    room.removePlayer('guest_session');
    const startFail = room.startGame('host_session');
    assert.ok(startFail.error);

    // Join back
    room.addPlayer('socket_guest', 'guest_session', 'Guest Pseudo', 'avatar_raccoon');
    const startSuccess = room.startGame('host_session');
    assert.strictEqual(startSuccess.success, true);
    assert.strictEqual(room.phase, 'PLAYING');
    assert.strictEqual(room.currentRound, 1);
  });

  await t.test('Cards distribution', () => {
    const host = room.players.get('host_session');
    const guest = room.players.get('guest_session');
    assert.strictEqual(host.cards.length, 5);
    assert.strictEqual(guest.cards.length, 5);
  });

  await t.test('Answer Validation & Submission', () => {
    const host = room.players.get('host_session');
    // Force a known card in host's hand for testing
    host.cards = ['A', 'B', 'C', 'D', 'E'];

    // 1. Submit word starting with wrong letter
    const resWrong = room.submitAnswer('host_session', 'Bateau', 'A');
    assert.strictEqual(resWrong.error, 'wrong_letter');

    // 2. Submit word with letter card not in hand
    const resNoCard = room.submitAnswer('host_session', 'Zebre', 'Z');
    assert.strictEqual(resNoCard.error, 'no_card');

    // 3. Submit correct word with card in hand
    // Current theme is generated randomly. Let's force theme to 'Animal'
    room.currentTheme = 'Animal';
    
    // Clear events list to track
    events.length = 0;
    const resOk = room.submitAnswer('host_session', 'Antilope', 'A');
    assert.strictEqual(resOk.success, true);
    
    // Card should be temporarily removed from hand pending challenge window
    assert.strictEqual(host.cards.includes('A'), false);
    assert.strictEqual(host.cards.length, 4);
    
    // Check broadcast event
    assert.strictEqual(events[0].eventName, 'rapide:answerSubmitted');
    assert.strictEqual(events[0].payload.word, 'Antilope');
    assert.strictEqual(events[0].payload.letter, 'A');
  });

  await t.test('Auto-Accept after timer', async () => {
    // Trigger auto-accept manually by calling _acceptAnswer
    const answerKeys = Array.from(room.answers.keys());
    const answerId = answerKeys[answerKeys.length - 1];
    
    events.length = 0;
    room._acceptAnswer(answerId);
    
    assert.strictEqual(room.answers.get(answerId).status, 'accepted');
    assert.strictEqual(room.validAnswersCount, 1);
    assert.strictEqual(events[0].eventName, 'rapide:answerAccepted');
  });

  await t.test('Duplicate answer check', () => {
    const guest = room.players.get('guest_session');
    guest.cards = ['A', 'F'];

    // Trying to submit duplicate word "Antilope" under same theme
    const resDup = room.submitAnswer('guest_session', 'Antilope', 'A');
    assert.strictEqual(resDup.error, 'duplicate');
  });

  await t.test('Challenge Flow - Rejection', () => {
    const guest = room.players.get('guest_session');
    guest.cards = ['F'];

    const resOk = room.submitAnswer('guest_session', 'Faux', 'F');
    assert.strictEqual(resOk.success, true);

    const answerKeys = Array.from(room.answers.keys());
    const answerId = answerKeys[answerKeys.length - 1];

    // Challenge the answer
    room.challengeAnswer('host_session', answerId);
    assert.strictEqual(room.answers.get(answerId).status, 'challenged');

    // Vote to reject by host (majority of voters excluding owner is host)
    room.castVote('host_session', answerId, false);
    
    // Should be rejected
    assert.strictEqual(room.answers.get(answerId).status, 'rejected');
    // Card should return to guest
    assert.strictEqual(guest.cards.includes('F'), true);
  });

  // Clean up
  room.destroy();
});
