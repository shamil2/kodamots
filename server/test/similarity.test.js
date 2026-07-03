const test = require('node:test');
const assert = require('node:assert');
const { cleanWord, levenshteinDistance, areSimilarWords } = require('../src/similarity');

test('cleanWord helper', () => {
  assert.strictEqual(cleanWord('Voiture'), 'voiture');
  assert.strictEqual(cleanWord('  velo  '), 'velo');
  assert.strictEqual(cleanWord('vélo'), 'velo');
  assert.strictEqual(cleanWord('GARÇON'), 'garcon');
  assert.strictEqual(cleanWord(''), '');
});

test('levenshteinDistance helper', () => {
  assert.strictEqual(levenshteinDistance('voiture', 'voitures'), 1);
  assert.strictEqual(levenshteinDistance('bateau', 'bateaux'), 1);
  assert.strictEqual(levenshteinDistance('chien', 'chats'), 3);
});

test('areSimilarWords spelling tolerance', () => {
  // Accents ignored
  assert.strictEqual(areSimilarWords('vélo', 'Velo'), true);
  assert.strictEqual(areSimilarWords('garçon', 'garcon'), true);

  // Plurals (1 letter diff, length >= 4)
  assert.strictEqual(areSimilarWords('voiture', 'voitures'), true);
  assert.strictEqual(areSimilarWords('bateau', 'bateaux'), true);

  // Small typo (1 letter diff, length >= 4)
  assert.strictEqual(areSimilarWords('pari', 'paris'), true);

  // 2 letter difference for longer words (length >= 6)
  assert.strictEqual(areSimilarWords('elephant', 'elephants'), true);

  // Non-similar words
  assert.strictEqual(areSimilarWords('chien', 'chats'), false);
  assert.strictEqual(areSimilarWords('un', 'une'), false); // length is < 4, so no typo tolerance
});
