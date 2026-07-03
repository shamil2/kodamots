const fs = require('fs');
const path = require('path');

class DictionaryService {
  constructor() {
    this.dictionaries = {};   // { fr: Set, en: Set }
    this.loaded = false;
  }

  /**
   * Load all dictionary JSON files from the dictionaries/ folder.
   * Each file is an array of lowercase words.
   */
  load() {
    const dictDir = path.join(__dirname, 'dictionaries');
    const files = ['fr', 'en'];

    for (const lang of files) {
      const filePath = path.join(dictDir, `${lang}.json`);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const words = JSON.parse(raw);
        if (!Array.isArray(words)) {
          throw new Error(`Dictionary ${lang}.json is not an array`);
        }
        this.dictionaries[lang] = new Set(words.map((w) => w.toLowerCase().trim()));
        console.log(`[DictionaryService] Loaded ${this.dictionaries[lang].size} words for "${lang}"`);
      } catch (err) {
        console.error(`[DictionaryService] Failed to load ${lang}.json:`, err.message);
        this.dictionaries[lang] = new Set();
      }
    }

    // Build a "mixed" set that is the union of fr + en
    this.dictionaries.mixed = new Set([
      ...this.dictionaries.fr,
      ...this.dictionaries.en,
    ]);
    console.log(`[DictionaryService] Mixed dictionary: ${this.dictionaries.mixed.size} words`);

    this.loaded = true;
  }

  /**
   * Check if a word exists in the dictionary for the given language.
   * @param {string} word
   * @param {string} language  'fr' | 'en' | 'mixed'
   * @returns {boolean}
   */
  isValidWord(word, language = 'mixed') {
    if (!this.loaded) {
      console.warn('[DictionaryService] Dictionaries not loaded yet');
      return false;
    }
    if (!word || typeof word !== 'string') return false;

    const dict = this.dictionaries[language] || this.dictionaries.mixed;
    return dict.has(word.toLowerCase().trim());
  }

  /**
   * Get a list of all loaded languages.
   */
  getLanguages() {
    return Object.keys(this.dictionaries);
  }

  /**
   * Get the word count for a language.
   */
  getWordCount(language) {
    const dict = this.dictionaries[language];
    return dict ? dict.size : 0;
  }
}

module.exports = new DictionaryService();
