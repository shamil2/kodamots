# SpeedBac Rapide — Technical Specification

> **Status:** Implementation not started  
> **Mode:** New game mode alongside existing Petit Bac  
> **Codebase root:** `/Users/shamilghaseeta/projects/shamil/ptibac`

---

## 1. Design Decisions (Locked)

| Decision | Value | Rationale |
|---|---|---|
| Challenge window | **3 seconds** | Faster feel than PRD's 5s default |
| Duplicate simultaneous answers | **First received wins, second auto-rejected** | Server-authoritative, fair |
| Game end conditions | **Both: score limit (40 pts) OR all rounds done** | Matches PRD MVP |
| Letter card penalty | **1 point per remaining card** | Simple mode as per PRD |
| Cards per player | **5 (configurable 3–7)** | PRD default |
| Valid answers before theme change | **3 (configurable 2–5)** | PRD default |
| Score limit | **40 pts (configurable 10–100)** | PRD default |
| Desktop block | **Same as Petit Bac (mobile only)** | Consistency |
| Petit Bac unchanged | **Yes, completely separate code path** | No regression risk |
| Validation mode | **Trust (auto-accept) + group challenge** | PRD MVP recommendation |
| Letter weighting | **Common letters more frequent** | PRD §8.5 |

---

## 2. Server Architecture

### 2.1 File Map

```
server/src/
  RapideRoom.js          [NEW]  – Full game engine for Rapide mode
  constants.js           [MOD]  – Add RAPIDE_PHASES, RAPIDE_TIMERS, RAPIDE_SCORING, RAPIDE_THEMES
  GameManager.js         [MOD]  – Dispatch createRoom to correct Room class by gameMode
  index.js               [MOD]  – Add rapide:* socket handlers
  Room.js                [NO CHANGE]
  DictionaryService.js   [NO CHANGE]
  similarity.js          [NO CHANGE]
```

### 2.2 RapideRoom State Machine

```
LOBBY → PLAYING → ROUND_SUMMARY → (PLAYING | FINAL_SCORES)
```

- **LOBBY** — players join, host configures, waits for start  
- **PLAYING** — active round: theme displayed, players submit answers  
- **ROUND_SUMMARY** — round ended (someone emptied hand), showing penalties (8s auto-advance)  
- **FINAL_SCORES** — game over (score limit or rounds exhausted)

### 2.3 RapideRoom Player Object

```javascript
{
  socketId:    string,
  sessionId:   string,
  name:        string,
  avatarId:    string|null,
  isHost:      boolean,
  connected:   boolean,
  cards:       string[],       // e.g. ['A', 'B', 'M', 'S', 'T'] — current hand
  totalScore:  number,         // cumulative penalty points (lower is better)
}
```

### 2.4 RapideRoom Answer Object

```javascript
{
  id:           string,         // `${sessionId}_${Date.now()}`
  sessionId:    string,
  pseudo:       string,
  avatarId:     string|null,
  word:         string,         // as submitted
  letter:       string,         // which card was used (single uppercase char)
  themeIndex:   number,         // which theme was active when submitted
  status:       'pending' | 'accepted' | 'rejected' | 'challenged',
  submittedAt:  number,         // Date.now()
  challengerId: string|null,
  votes:        Map<sessionId, boolean>,  // true=accept, false=reject
}
```

### 2.5 RapideRoom Core Methods

```javascript
class RapideRoom {
  constructor(code, hostSocketId, hostSessionId, hostName, hostAvatarId, config, emit)
  
  // Player management (mirrors Room.js)
  addPlayer(socketId, sessionId, name, avatarId)
  handleDisconnect(sessionId, socketId)
  removePlayer(sessionId)
  getPlayerList()              // includes cards: [], totalScore: number
  getState()                   // full room state snapshot for reconnection
  destroy()
  
  // Game flow
  startGame(sessionId)         // deals cards, picks first theme, → PLAYING
  _dealCards()                 // assigns weighted random letters to each player
  _nextTheme()                 // advances theme pointer or reshuffles deck
  _checkRoundEnd()             // checks if any player has 0 cards
  _endRound()                  // calculates penalties, advances scores, → ROUND_SUMMARY
  _checkGameEnd()              // checks score limit or round count
  nextRound(sessionId)         // host triggers next round (or auto after 8s)
  restartGame(sessionId)       // full restart (resets all scores)
  
  // Answer flow
  submitAnswer(sessionId, word, letter)
  _validateAnswer(sessionId, word, letter)  // letter match + dup check
  _acceptAnswer(answerId)       // discard card, incr theme counter, check round/theme end
  _rejectAnswer(answerId)       // card returns to player hand
  
  // Challenge flow
  challengeAnswer(challengerId, answerId)
  castVote(voterId, answerId, accept)
  _resolveChallenge(answerId)   // majority → accept/reject; ties → auto-accept
  
  // Skip theme (host only)
  skipTheme(sessionId)
}
```

### 2.6 Letter Distribution (Weighted)

French weighted distribution — common letters appear 3×, uncommon 2×, rare 1×:

```javascript
const LETTER_WEIGHTS_FR = {
  A:3, B:1, C:3, D:2, E:3, F:1, G:1, H:1, I:3, J:1,
  K:1, L:3, M:2, N:3, O:3, P:2, Q:1, R:3, S:3, T:3,
  U:2, V:1, W:1, X:1, Y:1, Z:1
};
// Build weighted pool, filter rare if excludeRareLetters=true
// Deal N cards per player by sampling independently (players CAN share same letter)
```

### 2.7 Themes Lists

**French (Classic Pack — 20 themes):**
```
Animal, Prénom, Pays / Ville, Fruit / Légume, Métier, Objet, Sport,
Film / Série, Célébrité, Marque, Couleur, Instrument de musique,
Plante, Vêtement, Moyen de transport, Personnage de dessin animé,
Plat / Recette, Boisson, Matière scolaire, Outil
```

**English (Classic Pack — 20 themes):**
```
Animal, First Name, Country / City, Fruit / Vegetable, Job, Object, Sport,
Movie / TV Show, Celebrity, Brand, Color, Musical Instrument,
Plant, Clothing, Vehicle, Cartoon Character, Dish / Recipe, Drink,
School Subject, Tool
```

### 2.8 New Constants to Add to constants.js

```javascript
const RAPIDE_PHASES = {
  LOBBY:          'LOBBY',
  PLAYING:        'PLAYING',
  ROUND_SUMMARY:  'ROUND_SUMMARY',
  FINAL_SCORES:   'FINAL_SCORES',
};

const RAPIDE_TIMERS = {
  CHALLENGE_WINDOW:    3000,   // ms after answer submitted before auto-accept
  VOTE_TIMEOUT:       20000,   // max time for challenge vote
  ROUND_SUMMARY_AUTO: 8000,   // auto-advance to next round
  RECONNECT_GRACE:  120000,   // same as Petit Bac
};

const RAPIDE_SCORING = {
  CARD_PENALTY:    1,    // penalty pts per remaining card at round end
  DEFAULT_LIMIT:  40,    // game ends when a player reaches this
};

const RAPIDE_CONFIG = {
  MIN_CARDS: 3, MAX_CARDS: 7, DEFAULT_CARDS: 5,
  MIN_ANSWERS_PER_THEME: 2, MAX_ANSWERS_PER_THEME: 5, DEFAULT_ANSWERS_PER_THEME: 3,
  MIN_SCORE_LIMIT: 10, MAX_SCORE_LIMIT: 100, DEFAULT_SCORE_LIMIT: 40,
  MIN_ROUNDS: 1, MAX_ROUNDS: 10, DEFAULT_ROUNDS: 5,
};

const RAPIDE_THEMES = {
  fr: [
    'Animal', 'Prénom', 'Pays / Ville', 'Fruit / Légume', 'Métier',
    'Objet', 'Sport', 'Film / Série', 'Célébrité', 'Marque',
    'Couleur', 'Instrument de musique', 'Plante', 'Vêtement',
    'Moyen de transport', 'Personnage de dessin animé',
    'Plat / Recette', 'Boisson', 'Matière scolaire', 'Outil'
  ],
  en: [
    'Animal', 'First Name', 'Country / City', 'Fruit / Vegetable', 'Job',
    'Object', 'Sport', 'Movie / TV Show', 'Celebrity', 'Brand',
    'Color', 'Musical Instrument', 'Plant', 'Clothing',
    'Vehicle', 'Cartoon Character', 'Dish / Recipe', 'Drink',
    'School Subject', 'Tool'
  ],
};
```

---

## 3. Socket Events Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `room:create` | `{pseudo, avatarId, config:{gameMode:'rapide', language, cardsPerPlayer, answersPerTheme, scoreLimit, rounds}}` | Extended with gameMode |
| `game:start` | `{roomCode}` | Reused — works for both modes |
| `rapide:submitAnswer` | `{word: string, letter: string}` | Player submits word using letter card |
| `rapide:challengeAnswer` | `{answerId: string}` | Challenge a pending answer |
| `rapide:vote` | `{answerId: string, accept: boolean}` | Vote on a challenged answer |
| `rapide:skipTheme` | `{}` | Host skips current theme |
| `rapide:nextRound` | `{}` | Host manually triggers next round |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `rapide:gameStarted` | `{playerCards, theme, themeIndex:0, validAnswersCount:0, answersNeeded, round:1, totalRounds, scoreLimit}` | Game starts, hands dealt |
| `rapide:themeChanged` | `{theme, themeIndex, validAnswersCount:0, answersNeeded}` | New theme after N valid answers |
| `rapide:answerSubmitted` | `{answerId, playerId, pseudo, avatarId, word, letter, status:'pending'}` | Broadcast to all |
| `rapide:answerAccepted` | `{answerId, playerId, cardsRemaining, playerCards:string[], validAnswersCount}` | Card discarded, counter updated |
| `rapide:answerRejected` | `{answerId, playerId, letter, reason:'letter_mismatch'|'duplicate'|'vote_rejected'}` | Answer removed, card returned |
| `rapide:challengeStarted` | `{answerId, challengerId, word, letter, timeoutMs:3000}` | Challenge vote open |
| `rapide:challengeVoteUpdate` | `{answerId, acceptVotes:n, rejectVotes:n, totalVoters:n}` | Live vote tally |
| `rapide:roundEnded` | `{winnerId, winnerPseudo, penalties:[{playerId,pseudo,avatarId,cardsLeft,penaltyPts}], scores:[{playerId,pseudo,avatarId,totalScore}], round}` | Round over |
| `rapide:newRoundStarted` | `{playerCards, theme, themeIndex, validAnswersCount:0, answersNeeded, round}` | New round begins |
| `rapide:finalScores` | `{finalLeaderboard:[{playerId,pseudo,avatarId,totalScore,rank}], winnerId}` | Game over |
| `rapide:themeSkipped` | `{newTheme, themeIndex}` | Host skipped theme |

---

## 4. Client Architecture

### 4.1 File Map

```
client/src/
  App.jsx                          [MOD] – Add RAPIDE_GAME, RAPIDE_ROUND_SUMMARY + listeners
  index.css                        [MOD] – LetterCard, ThemePill, AnswerFeed, PlayerHands styles
  
  screens/
    CreateRoomScreen.jsx           [MOD] – gameMode toggle at top; Rapide config replaces categories
    LobbyScreen.jsx                [MOD] – show gameMode badge in config tags
    RapideGameScreen.jsx           [NEW] – main in-game view
    RapideRoundSummaryScreen.jsx   [NEW] – post-round penalty display
    FinalScoreScreen.jsx           [MOD] – accept isLowestWins prop, flip winner subtitle text
    
  components/
    LetterCard.jsx                 [NEW] – animated letter card tile
    (All others: NO CHANGE)
```

### 4.2 New App State Variables

```javascript
const [gameMode, setGameMode] = useState('petit_bac');         // 'petit_bac' | 'rapide'
const [rapideMyCards, setRapideMyCards] = useState([]);         // my current hand: string[]
const [rapidePlayerCards, setRapidePlayerCards] = useState({});  // {sessionId: string[]}
const [rapideTheme, setRapideTheme] = useState('');
const [rapideThemeIndex, setRapideThemeIndex] = useState(0);
const [rapideValidCount, setRapideValidCount] = useState(0);
const [rapideAnswersNeeded, setRapideAnswersNeeded] = useState(3);
const [rapideAnswerFeed, setRapideAnswerFeed] = useState([]);   // recent answers list
const [rapideRoundData, setRapideRoundData] = useState(null);   // roundEnded payload
const [rapideScoreLimit, setRapideScoreLimit] = useState(40);
const [rapideRoundNum, setRapideRoundNum] = useState(1);
const [rapideTotalRounds, setRapideTotalRounds] = useState(5);
```

### 4.3 gameMode from roomState

```javascript
// In handleRoomCreated AND handleRoomJoined:
const mode = data.roomState?.config?.gameMode || 'petit_bac';
setGameMode(mode);
```

### 4.4 RapideGameScreen Layout (mobile portrait)

```
┌──────────────────────────────┐
│ 🚪  Manche 2/5              │  quit + round badge
├──────────────────────────────┤
│                              │
│   ┌────────────────────┐     │
│   │  🎯  Animal        │     │  theme pill (large, centered)
│   └────────────────────┘     │
│   ●●○  2/3 réponses          │  progress dots
│                              │
├──────────────────────────────┤
│  Answer feed (scrollable)    │  Léa [🦊] Antilope [A] ✅
│  6 items max visible         │  Tom [🐻] Bison [B] ⏳
│                              │
├──────────────────────────────┤
│  [A] [B] [M] [S] [T]        │  my hand (tap to select)
│                              │
│  ┌──────────────────────┐    │
│  │ Tapez un mot...      │    │  text input (auto-focus)
│  └──────────────────────┘    │
│  [      Soumettre      ]     │  submit button
└──────────────────────────────┘
```

### 4.5 LetterCard Component Props/States

```jsx
// Props
{
  letter:    string,   // 'A'–'Z'
  selected:  boolean,  // glowing gold border
  used:      boolean,  // faded/slide-out animation
  disabled:  boolean,  // no hover, muted opacity
  onSelect:  fn,       // called when tapped (unless used/disabled)
}

// Visual states
// default:  cream/parchment card, bold dark letter, wooden border
// selected: gold glow ring, scale 1.1
// used:     shrinks and fades out (CSS @keyframes)
// disabled: 50% opacity, no cursor pointer
```

### 4.6 CSS Classes Needed

```css
/* Letter cards */
.letter-card { ... }
.letter-card--selected { ... }
.letter-card--used { ... }
.letter-card--disabled { ... }
.letter-card__letter { ... }

/* Theme display */
.rapide-theme-pill { ... }
.rapide-theme-pill--animating { ... }  /* slide-in on theme change */

/* Answer feed */
.rapide-answer-feed { ... }
.rapide-answer-feed__item { ... }
.rapide-answer-feed__item--accepted { ... }
.rapide-answer-feed__item--rejected { ... }
.rapide-answer-feed__item--pending { ... }
.rapide-answer-feed__item--challenged { ... }

/* Progress */
.rapide-progress-dots { ... }
.rapide-progress-dot { ... }
.rapide-progress-dot--filled { ... }

/* Player hands overview */
.rapide-player-hands { ... }
.rapide-player-hand { ... }

/* Round summary */
.rapide-round-summary { ... }
.rapide-penalty-table { ... }
.rapide-penalty-row { ... }
.rapide-penalty-row--winner { ... }

/* Game input area */
.rapide-input-area { ... }
.rapide-my-cards { ... }

/* Config tags */
.lobby__config-tag--mode { ... }
```

---

## 5. Validation Logic (Server-side)

```javascript
_normalize(word) {
  // Remove accents, uppercase
  return word.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Éléphant → ELEPHANT, Ça → CA
}

_validateAnswer(sessionId, word, letter) {
  const player = this.players.get(sessionId);
  if (!player) return { error: 'not_found' };

  const L = letter.toUpperCase();

  // 1. Player must hold the card
  if (!player.cards.includes(L)) {
    return { error: 'no_card' };
  }

  // 2. Word must start with the chosen letter (after normalization)
  const normalized = this._normalize(word);
  if (!normalized.startsWith(L)) {
    return { error: 'wrong_letter' };
  }

  // 3. No duplicate for current theme (accepted answers only)
  const dupCheck = normalized;
  for (const [, answer] of this.answers) {
    if (
      answer.themeIndex === this.themeIndex &&
      answer.status === 'accepted' &&
      this._normalize(answer.word) === dupCheck
    ) {
      return { error: 'duplicate' };
    }
  }

  return { ok: true };
}
```

---

## 6. getState() for Reconnection

```javascript
// RapideRoom.getState() — used for session:restore
getState() {
  return {
    code:              this.code,
    gameMode:          'rapide',
    phase:             this.phase,
    config: {
      gameMode:        'rapide',
      language:        this.language,
      cardsPerPlayer:  this.cardsPerPlayer,
      answersPerTheme: this.answersPerTheme,
      scoreLimit:      this.scoreLimit,
      rounds:          this.totalRounds,
    },
    players:           this.getPlayerList(),  // includes .cards and .totalScore
    theme:             this.currentTheme,
    themeIndex:        this.themeIndex,
    validAnswersCount: this.validAnswersCount,
    answersNeeded:     this.answersPerTheme,
    currentRound:      this.currentRound,
    totalRounds:       this.totalRounds,
    recentAnswers:     this._getRecentAnswers(10),
  };
}
```

---

## 7. CreateRoomScreen Changes Detail

When `gameMode === 'rapide'` is selected, **replace** the category multi-select with these 4 steppers:

| Setting | Control | Min | Max | Default | Step |
|---|---|---|---|---|---|
| Cards per player | Stepper | 3 | 7 | 5 | 1 |
| Answers per theme | Stepper | 2 | 5 | 3 | 1 |
| Score limit | Stepper | 10 | 100 | 40 | 5 |
| Rounds | Stepper | 1 | 10 | 5 | 1 |

The language selector and "rare letters" toggle remain visible.  
The "exclude rare letters" toggle stays but affects card distribution, not categories.

**Emit payload for Rapide:**
```javascript
socket.emit('room:create', {
  pseudo,
  avatarId,
  config: {
    gameMode: 'rapide',
    language,
    cardsPerPlayer,
    answersPerTheme,
    scoreLimit,
    rounds,
    excludeRareLetters,
  },
});
```

---

## 8. Server index.js New Handlers

```javascript
// Rapide: Submit answer
socket.on('rapide:submitAnswer', (data, ack) => {
  const { word, letter } = data || {};
  if (!word || !letter) return ack?.({ error: 'word and letter required' });
  const result = gameManager.rapideSubmitAnswer(sessionId, word.trim(), letter.trim());
  if (result.error) return ack?.({ error: result.error });
  ack?.({ success: true });
});

// Rapide: Challenge
socket.on('rapide:challengeAnswer', (data, ack) => {
  const { answerId } = data || {};
  if (!answerId) return ack?.({ error: 'answerId required' });
  const result = gameManager.rapideChallengeAnswer(sessionId, answerId);
  if (result.error) return ack?.({ error: result.error });
  ack?.({ success: true });
});

// Rapide: Vote on challenge
socket.on('rapide:vote', (data, ack) => {
  const { answerId, accept } = data || {};
  if (!answerId || typeof accept !== 'boolean') return ack?.({ error: 'invalid params' });
  const result = gameManager.rapideCastVote(sessionId, answerId, accept);
  if (result.error) return ack?.({ error: result.error });
  ack?.({ success: true });
});

// Rapide: Skip theme (host only)
socket.on('rapide:skipTheme', (data, ack) => {
  const result = gameManager.rapideSkipTheme(sessionId);
  if (result.error) return ack?.({ error: result.error });
  ack?.({ success: true });
});

// Rapide: Next round (host manually triggers)
socket.on('rapide:nextRound', (data, ack) => {
  const result = gameManager.rapideNextRound(sessionId);
  if (result.error) return ack?.({ error: result.error });
  ack?.({ success: true });
});
```

---

## 9. FinalScoreScreen: isLowestWins Support

For Rapide, the server emits `finalLeaderboard` sorted **ascending** (lowest score first = winner).  
Rank 1 = winner (lowest penalty score).

Add `isLowestWins` prop to FinalScoreScreen:
```jsx
// In FinalScoreScreen:
{isLowestWins && (
  <p className="final-score__subtitle">
    {t('rapide.lowestWins')}
  </p>
)}
```

In App.jsx, pass `isLowestWins={gameMode === 'rapide'}` when rendering FinalScoreScreen.
