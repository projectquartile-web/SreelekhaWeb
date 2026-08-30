/**
 * normalize.ts
 *
 * Two separate concerns:
 *
 * 1. generateDedupKey(title)
 *    Used for cross-source deduplication. Strips language/format annotations,
 *    year tags, 3D/IMAX markers, special characters. Produces the smallest
 *    stable string that identifies a specific film, regardless of which source
 *    provided it or what language/format annotations were appended.
 *
 *    Conservative strategy: ONLY strip content we can clearly identify as a
 *    language/format annotation or a year. We do NOT strip arbitrary words.
 *
 * 2. normalizeTime(time)
 *    Converts "10:30 AM" / "2:45 PM" / "10:30" to 24-hour "HH:MM" format.
 */

/**
 * Known Indian-cinema language names. Used to strip language-only parentheticals.
 * Includes common misspellings found on aggregator sites (e.g. "Malyalam").
 */
const LANGUAGE_NAMES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Malyalam', // common Shmoti typo
  'Bengali', 'Marathi', 'Punjabi', 'Bhojpuri', 'Odia',
  'Gujarati', 'Assamese', 'Urdu',
];

// Matches a parenthetical or bracketed group whose contents are ONLY language names
// separated by commas and optional spaces.
// E.g. "(Tamil,Telugu)" "(Kannada)" "[Hindi, Tamil]"
// Does NOT match "(Part One)" or "(2024)" — those have non-language content.
const LANGUAGE_GROUP_RE = new RegExp(
  // open bracket  (one or more langs separated by commas)   close bracket
  `[\\(\\[]\\s*(?:${LANGUAGE_NAMES.join('|')})(?:\\s*,\\s*(?:${LANGUAGE_NAMES.join('|')}))*\\s*[\\)\\]]`,
  'gi'
);

// Matches a trailing " - Language" or " : Language" suffix at end of string.
// E.g. "Irumudi - Tamil"  "Irumudi: Kannada"
const LANGUAGE_SUFFIX_RE = new RegExp(
  `\\s*[-:]\\s*(?:${LANGUAGE_NAMES.join('|')})\\s*$`,
  'gi'
);

/**
 * Generates a deduplication key from a raw movie title.
 *
 * This key is used to match the same movie across sources and store it in D1.
 * It intentionally strips all language/format metadata so that:
 *   "Irumudi (Tamil,Telugu)" → "irumudi"
 *   "Irumudi"               → "irumudi"   (same key → same movie)
 *   "Irumudi - Tamil"       → "irumudi"   (same key)
 *   "Irumudi [Kannada]"     → "irumudi"   (same key)
 *
 * It does NOT strip arbitrary parenthetical content to avoid incorrectly merging
 * different movies. Only parentheticals containing purely language names are removed.
 *
 * Year tags like (2024) are also removed, since the same film released in one year
 * should not create multiple records just because one source includes the year.
 */
export function generateDedupKey(title: string): string {
  let key = title;

  // Strip year tags: (2024) [2026] {2025} — bare 4-digit years too
  key = key.replace(/[\(\[\{]?\b\d{4}\b[\)\]\}]?/g, '');

  // Strip language-only parentheticals like "(Tamil,Telugu)" or "[Kannada]"
  key = key.replace(LANGUAGE_GROUP_RE, '');

  // Strip trailing language suffix like " - Tamil" or ": Kannada"
  // Apply repeatedly in case multiple suffixes exist
  let prev = '';
  while (prev !== key) {
    prev = key;
    key = key.replace(LANGUAGE_SUFFIX_RE, '');
  }

  // Strip format markers: 2D, 3D, 4DX, IMAX (standalone words only)
  key = key.replace(/\b(2d|3d|4dx|imax)\b/gi, '');

  // Lowercase
  key = key.toLowerCase();

  // Replace all non-alphanumeric characters with spaces
  key = key.replace(/[^a-z0-9]/g, ' ');

  // Collapse whitespace and trim
  key = key.replace(/\s+/g, ' ').trim();

  return key;
}

/**
 * Validates and normalizes a time string to HH:MM (24-hour) format.
 * Accepts inputs like "11:45 AM", "2:45 PM", "18:00".
 * Returns the original trimmed string if it cannot be parsed.
 */
export function normalizeTime(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return time.trim();

  const [, hoursStr, minutes, period] = match;
  let hours = parseInt(hoursStr, 10);

  if (period) {
    const p = period.toUpperCase();
    if (p === 'PM' && hours < 12) hours += 12;
    else if (p === 'AM' && hours === 12) hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}
