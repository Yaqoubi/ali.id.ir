/**
 * TextParser - Handles Persian text tokenization, punctuation separation, and ZWNJ preservation
 */

const TextParser = (() => {
  // Punctuation and bracket characters that should stay outside blanks/errors
  const LEADING_PUNCT_REGEX = /^([«"'({\[\s\u2013\u2014\-*]+)/u;
  const TRAILING_PUNCT_REGEX = /([»"')}\]،؛؟:!.\u2013\u2014…*\-]+)$/u;

  /**
   * Split a single token into leading punctuation, clean word stem, and trailing punctuation
   */
  function splitWordPunctuation(rawToken) {
    if (!rawToken) return { leading: '', stem: '', trailing: '' };

    let leading = '';
    let trailing = '';
    let stem = rawToken;

    const leadMatch = stem.match(LEADING_PUNCT_REGEX);
    if (leadMatch) {
      leading = leadMatch[1];
      stem = stem.slice(leading.length);
    }

    const trailMatch = stem.match(TRAILING_PUNCT_REGEX);
    if (trailMatch) {
      trailing = trailMatch[1];
      stem = stem.slice(0, stem.length - trailing.length);
    }

    return {
      leading,
      stem,
      trailing
    };
  }

  /**
   * Tokenize plain text into structured paragraphs and word objects
   */
  function parseText(rawText) {
    if (!rawText) return [];

    // Normalize newlines
    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rawParagraphs = normalized.split(/\n+/).map(p => p.trim()).filter(Boolean);

    let globalWordIndex = 0;

    return rawParagraphs.map((paraText, pIdx) => {
      // Split paragraph by spaces (preserving ZWNJ \u200c inside words)
      const rawWords = paraText.split(/\s+/).filter(Boolean);

      const tokens = rawWords.map((w, wIdx) => {
        const { leading, stem, trailing } = splitWordPunctuation(w);
        const id = `w_${pIdx}_${wIdx}_${globalWordIndex++}`;

        return {
          id,
          raw: w,
          leading,
          stem,
          trailing,
          // Flag if word is actually a word with letters (not just lone symbols)
          isSelectable: /[\u0600-\u06FF\w]/u.test(stem)
        };
      });

      return {
        paragraphIndex: pIdx,
        rawText: paraText,
        tokens
      };
    });
  }

  return {
    splitWordPunctuation,
    parseText
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextParser;
}
