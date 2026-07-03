// ─── Game Phases ─────────────────────────────────────────────────────────────
const PHASES = {
  LOBBY: 'LOBBY',
  LETTER_SPIN: 'LETTER_SPIN',
  INPUT: 'INPUT',
  COUNTDOWN: 'COUNTDOWN',
  VOTING: 'VOTING',
  SCORES: 'SCORES',
  FINAL_SCORES: 'FINAL_SCORES',
};

// ─── Timing (milliseconds) ──────────────────────────────────────────────────
const TIMERS = {
  LETTER_SPIN_DURATION: 3000,     // visual letter animation
  COUNTDOWN_DURATION: 5000,       // after SPEED pressed
  VOTE_TIMEOUT: 30000,            // max time for voting phase
  SCORE_DISPLAY_DURATION: 8000,   // show round scores before next round
  RECONNECT_GRACE_PERIOD: 120000,  // 120 seconds (2 minutes) to reconnect
};

// ─── Scoring ─────────────────────────────────────────────────────────────────
const SCORING = {
  VALID_UNIQUE: 10,
  VALID_SHARED: 5,
  INVALID: 0,
  EMPTY: 0,
  SPEED_BONUS: 2,
};

// ─── Room Config ─────────────────────────────────────────────────────────────
const ROOM = {
  CODE_LENGTH: 4,
  CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MIN_ROUNDS: 1,
  MAX_ROUNDS: 10,
  DEFAULT_ROUNDS: 3,
};

// ─── Alphabet ────────────────────────────────────────────────────────────────
const ALPHABET_FULL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const RARE_LETTERS = ['W', 'X', 'Y', 'Z'];

// ─── Categories per Language ─────────────────────────────────────────────────
const CATEGORIES = {
  fr: [
    'Prénom',
    'Animal',
    'Pays / Ville',
    'Fruit / Légume',
    'Métier',
    'Objet',
    'Célébrité',
    'Film / Série',
    'Sport',
    'Marque',
  ],
  en: [
    'First Name',
    'Animal',
    'Country / City',
    'Fruit / Vegetable',
    'Profession',
    'Object',
    'Celebrity',
    'Movie / TV Show',
    'Sport',
    'Brand',
  ],
};

// ─── Supported Languages ────────────────────────────────────────────────────
const LANGUAGES = ['fr', 'en', 'mixed'];

// ─── Rapide Game Mode ────────────────────────────────────────────────────────
const RAPIDE_PHASES = {
  LOBBY:          'LOBBY',
  PLAYING:        'PLAYING',
  ROUND_SUMMARY:  'ROUND_SUMMARY',
  FINAL_SCORES:   'FINAL_SCORES',
};

const RAPIDE_TIMERS = {
  CHALLENGE_WINDOW:    3000,    // ms after submission before auto-accept
  VOTE_TIMEOUT:       20000,    // max time for challenge vote
  ROUND_SUMMARY_AUTO:  8000,    // auto-advance to next round
  RECONNECT_GRACE:   120000,    // grace period for disconnected players
};

const RAPIDE_SCORING = {
  CARD_PENALTY:   1,    // penalty pts per remaining card at round end
  DEFAULT_LIMIT: 40,    // game ends when a player reaches this score
};

const RAPIDE_CONFIG = {
  MIN_CARDS: 3, MAX_CARDS: 7, DEFAULT_CARDS: 5,
  MIN_ANSWERS_PER_THEME: 2, MAX_ANSWERS_PER_THEME: 5, DEFAULT_ANSWERS_PER_THEME: 3,
  MIN_SCORE_LIMIT: 10, MAX_SCORE_LIMIT: 100, DEFAULT_SCORE_LIMIT: 40,
  MIN_ROUNDS: 1, MAX_ROUNDS: 10, DEFAULT_ROUNDS: 5,
};

// Weighted letter pools — higher weight = appears more often in hands
// Common=3, Uncommon=2, Rare=1
const LETTER_WEIGHTS_FR = {
  A:3, B:1, C:3, D:2, E:3, F:1, G:1, H:1, I:3, J:1,
  K:1, L:3, M:2, N:3, O:3, P:2, Q:1, R:3, S:3, T:3,
  U:2, V:1, W:1, X:1, Y:1, Z:1,
};

const LETTER_WEIGHTS_EN = {
  A:3, B:2, C:3, D:2, E:3, F:2, G:2, H:2, I:3, J:1,
  K:1, L:2, M:2, N:3, O:3, P:2, Q:1, R:3, S:3, T:3,
  U:2, V:1, W:2, X:1, Y:1, Z:1,
};

const RAPIDE_THEMES = {
  fr: [
    'Animal', 'Prénom', 'Pays / Ville', 'Fruit / Légume', 'Métier',
    'Objet', 'Sport', 'Film / Série', 'Célébrité', 'Marque',
    'Couleur', 'Instrument de musique', 'Plante', 'Vêtement',
    'Moyen de transport', 'Personnage de dessin animé',
    'Plat / Recette', 'Boisson', 'Matière scolaire', 'Outil',
  ],
  en: [
    'Animal', 'First Name', 'Country / City', 'Fruit / Vegetable', 'Job',
    'Object', 'Sport', 'Movie / TV Show', 'Celebrity', 'Brand',
    'Color', 'Musical Instrument', 'Plant', 'Clothing',
    'Vehicle', 'Cartoon Character', 'Dish / Recipe', 'Drink',
    'School Subject', 'Tool',
  ],
};

module.exports = {
  PHASES,
  TIMERS,
  SCORING,
  ROOM,
  ALPHABET_FULL,
  RARE_LETTERS,
  CATEGORIES,
  LANGUAGES,
  RAPIDE_PHASES,
  RAPIDE_TIMERS,
  RAPIDE_SCORING,
  RAPIDE_CONFIG,
  LETTER_WEIGHTS_FR,
  LETTER_WEIGHTS_EN,
  RAPIDE_THEMES,
};
