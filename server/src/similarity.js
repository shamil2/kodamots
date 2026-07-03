// Helper to calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

// Helper to normalize a word (lowercase, trim, strip accents)
function cleanWord(w) {
  if (!w) return '';
  return w
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Helper for spelling-tolerant equality
function areSimilarWords(w1, w2) {
  const c1 = cleanWord(w1);
  const c2 = cleanWord(w2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;

  const len1 = c1.length;
  const len2 = c2.length;
  const dist = levenshteinDistance(c1, c2);

  // 1-letter difference for words of length >= 4 (handles simple singular/plural or typo)
  if (dist === 1 && Math.min(len1, len2) >= 4) {
    return true;
  }
  // 2-letter difference for longer words (length >= 6)
  if (dist <= 2 && Math.min(len1, len2) >= 6) {
    return true;
  }

  return false;
}

module.exports = {
  levenshteinDistance,
  cleanWord,
  areSimilarWords,
};
