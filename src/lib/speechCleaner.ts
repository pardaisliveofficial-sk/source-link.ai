/**
 * Intelligent Speech Recognition Deduplication & Text Revision Helper
 * Cleans repeating speech artifacts, consecutive phrase loops, and jumbled transcripts.
 */

export function cleanAndReviseVoiceInput(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.trim();
  if (!text) return '';

  // 1. Remove duplicate adjacent words (case-insensitive check)
  // e.g. "error error error" -> "error", "karo karo" -> "karo"
  text = deduplicateAdjacentWords(text);

  // 2. Remove duplicate adjacent phrases (n-grams from 2 up to 10 words)
  // e.g. "login issue fix karo login issue fix karo" -> "login issue fix karo"
  text = deduplicateAdjacentPhrases(text);

  // 3. Deduplicate repeating sentences / clauses
  text = deduplicateSentences(text);

  // 4. Clean extra spaces, punctuation spaces, and capitalize properly
  text = normalizeWhitespaceAndPunctuation(text);

  return text;
}

/**
 * Deduplicate adjacent repeating words
 */
function deduplicateAdjacentWords(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 1) return text;

  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const prevWord = result[result.length - 1];

    if (!prevWord) {
      result.push(currentWord);
      continue;
    }

    // Normalize words for comparison (strip punctuation, lower-case)
    const normCurrent = currentWord.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/g, '');
    const normPrev = prevWord.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/g, '');

    if (normCurrent && normPrev && normCurrent === normPrev) {
      // Skip duplicate word
      continue;
    }

    result.push(currentWord);
  }

  return result.join(' ');
}

/**
 * Deduplicate adjacent repeating phrases (n-grams from 2 to 10 words)
 */
function deduplicateAdjacentPhrases(text: string): string {
  let words = text.split(/\s+/);
  if (words.length < 4) return text;

  let modified = true;
  let iterations = 0;

  while (modified && iterations < 5) {
    modified = false;
    iterations++;

    // Try phrase lengths from 10 down to 2
    const maxPhraseLen = Math.min(10, Math.floor(words.length / 2));

    for (let len = maxPhraseLen; len >= 2; len--) {
      for (let i = 0; i <= words.length - 2 * len; i++) {
        const phrase1 = words.slice(i, i + len).map(w => w.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/g, '')).join(' ');
        const phrase2 = words.slice(i + len, i + 2 * len).map(w => w.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/g, '')).join(' ');

        if (phrase1.length > 0 && phrase1 === phrase2) {
          // Remove the duplicate phrase2
          words.splice(i + len, len);
          modified = true;
          break; // re-run loop with updated words
        }
      }
      if (modified) break;
    }
  }

  return words.join(' ');
}

/**
 * Deduplicate repeating sentences or comma-separated clauses
 */
function deduplicateSentences(text: string): string {
  // Split on sentence terminators (. ? ! \n)
  const sentences = text.split(/(?<=[.?!])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return text;

  const seen = new Set<string>();
  const uniqueSentences: string[] = [];

  for (const s of sentences) {
    const normalized = s.toLowerCase().replace(/[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/g, '');
    if (normalized.length > 3) {
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
    }
    uniqueSentences.push(s);
  }

  return uniqueSentences.join(' ');
}

/**
 * Clean up whitespaces, punctuation spacing, and tidy output
 */
function normalizeWhitespaceAndPunctuation(text: string): string {
  let cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?:;])/g, '$1')
    .replace(/([.,!?:;])\1+/g, '$1')
    .trim();

  // Capitalize first letter if it starts with standard alphabet
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}
