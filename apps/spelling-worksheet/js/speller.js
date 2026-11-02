/**
 * Speller Engine - Persian Homophone Spelling Error Generator
 * Generates phonetically identical spelling mistakes for educational worksheets.
 */

const Speller = (() => {
  // Groups of letters that sound identical in Persian elementary curriculum
  const HOMOPHONE_GROUPS = [
    ['س', 'ص', 'ث'],
    ['ز', 'ذ', 'ض', 'ظ'],
    ['ت', 'ط'],
    ['ق', 'غ'],
    ['ح', 'ه'],
    ['ع', 'ء', 'ئ']
  ];

  // Map each homophone letter to its candidate replacements
  const HOMOPHONE_MAP = {};
  HOMOPHONE_GROUPS.forEach(group => {
    group.forEach(char => {
      HOMOPHONE_MAP[char] = group.filter(c => c !== char);
    });
  });

  /**
   * Check if a word contains any letter that has homophones
   */
  function hasHomophones(word) {
    if (!word) return false;
    for (const ch of word) {
      if (HOMOPHONE_MAP[ch]) return true;
    }
    // Also special case: word starting with 'ع'
    if (word.startsWith('ع')) return true;
    return false;
  }

  /**
   * Generate spelling error variations for a given word
   * Returns an array of distinct misspelled versions
   */
  function generateSpellingErrors(word) {
    if (!word || !hasHomophones(word)) return [];

    const results = new Set();
    const chars = Array.from(word);

    // 1. Single replacement for each homophone character
    chars.forEach((ch, idx) => {
      const replacements = HOMOPHONE_MAP[ch];
      if (replacements && replacements.length > 0) {
        replacements.forEach(rep => {
          const newChars = [...chars];
          newChars[idx] = rep;
          results.add(newChars.join(''));
        });
      }
    });

    // Special case for initial 'ع' -> 'ا' or 'آ'
    if (word.startsWith('ع')) {
      results.add('ا' + word.slice(1));
      results.add('آ' + word.slice(1));
    }

    // 2. If word has multiple homophones, also generate multi-replacement variants
    const homophoneIndices = [];
    chars.forEach((ch, idx) => {
      if (HOMOPHONE_MAP[ch]) homophoneIndices.push(idx);
    });

    if (homophoneIndices.length >= 2 && homophoneIndices.length <= 4) {
      const comboChars = [...chars];
      homophoneIndices.forEach(idx => {
        const reps = HOMOPHONE_MAP[chars[idx]];
        if (reps && reps.length > 0) {
          comboChars[idx] = reps[0];
        }
      });
      results.add(comboChars.join(''));
    }

    const list = Array.from(results).filter(w => w !== word && w.length > 0);
    return list;
  }

  /**
   * Get the primary (default) misspelled version
   */
  function getDefaultSpellingError(word) {
    const errors = generateSpellingErrors(word);
    return errors.length > 0 ? errors[0] : null;
  }

  return {
    HOMOPHONE_GROUPS,
    HOMOPHONE_MAP,
    hasHomophones,
    generateSpellingErrors,
    getDefaultSpellingError
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Speller;
}
