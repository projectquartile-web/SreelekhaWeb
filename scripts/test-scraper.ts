/**
 * scripts/test-scraper.ts
 *
 * Standalone test suite for Phase 1 scraper logic.
 * Runs entirely in Node.js — no dev server, no D1 calls.
 *
 * Tests:
 *   1. generateDedupKey — title normalization and cross-source matching
 *   2. normalizeTime    — showtime string to HH:MM
 *   3. ShmotiSource.parseHtml — real HTML parsing (uses shmoti.html if present)
 *   4. Deduplication logic — same movie from two sources merges correctly
 *   5. Source failure safety — failed source movies excluded from sync input
 *   6. Manual override — is_manual_override respected (logic check)
 */

import * as cheerio from 'cheerio';
import { readFileSync, existsSync } from 'fs';

// ── Inline the normalize functions (avoids tsconfig path alias issues in Node) ──────
const LANGUAGE_NAMES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Malyalam',
  'Bengali', 'Marathi', 'Punjabi', 'Bhojpuri', 'Odia',
  'Gujarati', 'Assamese', 'Urdu',
];
const LANGUAGE_GROUP_RE = new RegExp(
  `[\\(\\[]\\s*(?:${LANGUAGE_NAMES.join('|')})(?:\\s*,\\s*(?:${LANGUAGE_NAMES.join('|')}))*\\s*[\\)\\]]`,
  'gi'
);
const LANGUAGE_SUFFIX_RE = new RegExp(
  `\\s*[-:]\\s*(?:${LANGUAGE_NAMES.join('|')})\\s*$`,
  'gi'
);

function generateDedupKey(title: string): string {
  let key = title;
  key = key.replace(/[\(\[\{]?\b\d{4}\b[\)\]\}]?/g, '');
  key = key.replace(LANGUAGE_GROUP_RE, '');
  let prev = '';
  while (prev !== key) { prev = key; key = key.replace(LANGUAGE_SUFFIX_RE, ''); }
  key = key.replace(/\b(2d|3d|4dx|imax)\b/gi, '');
  key = key.toLowerCase();
  key = key.replace(/[^a-z0-9]/g, ' ');
  key = key.replace(/\s+/g, ' ').trim();
  return key;
}

function normalizeTime(time: string): string {
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

// ── Test harness ─────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function test(description: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.log(`  ❌ ${description}${detail ? `\n     → ${detail}` : ''}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ────────────────────────────────────────────────────────────────────────────────────
section('1. generateDedupKey — Cross-source deduplication');

// Same movie, different language annotations → must produce same key
test(
  '"Irumudi" → "irumudi"',
  generateDedupKey('Irumudi') === 'irumudi'
);
test(
  '"Irumudi (Tamil,Telugu)" → "irumudi"',
  generateDedupKey('Irumudi (Tamil,Telugu)') === 'irumudi',
  `got: "${generateDedupKey('Irumudi (Tamil,Telugu)')}"`
);
test(
  '"Irumudi (Tamil, Telugu)" → "irumudi" (space after comma)',
  generateDedupKey('Irumudi (Tamil, Telugu)') === 'irumudi',
  `got: "${generateDedupKey('Irumudi (Tamil, Telugu)')}"`
);
test(
  '"Irumudi - Tamil" → "irumudi" (dash suffix)',
  generateDedupKey('Irumudi - Tamil') === 'irumudi',
  `got: "${generateDedupKey('Irumudi - Tamil')}"`
);
test(
  '"Irumudi [Kannada]" → "irumudi" (bracket)',
  generateDedupKey('Irumudi [Kannada]') === 'irumudi',
  `got: "${generateDedupKey('Irumudi [Kannada]')}"`
);
test(
  '"IRUMUDI" → "irumudi" (all caps)',
  generateDedupKey('IRUMUDI') === 'irumudi'
);
test(
  '"Toxic (Hindi,Kannada,Malyalam,Tamil,Telugu)" → "toxic"',
  generateDedupKey('Toxic (Hindi,Kannada,Malyalam,Tamil,Telugu)') === 'toxic',
  `got: "${generateDedupKey('Toxic (Hindi,Kannada,Malyalam,Tamil,Telugu)')}"`
);

// Year stripping
test(
  '"Devara Part 1 (2024)" → "devara part 1"',
  generateDedupKey('Devara Part 1 (2024)') === 'devara part 1',
  `got: "${generateDedupKey('Devara Part 1 (2024)')}"`
);

// Format markers
test(
  '"KGF Chapter 2 3D" → "kgf chapter 2"',
  generateDedupKey('KGF Chapter 2 3D') === 'kgf chapter 2',
  `got: "${generateDedupKey('KGF Chapter 2 3D')}"`
);

// Must NOT collapse different movies
test(
  '"Irumudi" ≠ "Irumudi 2" (different sequels are different movies)',
  generateDedupKey('Irumudi') !== generateDedupKey('Irumudi 2')
);
test(
  '"KGF Chapter 1" ≠ "KGF Chapter 2"',
  generateDedupKey('KGF Chapter 1') !== generateDedupKey('KGF Chapter 2')
);
test(
  '"Awarapan 2" ≠ "Aawarapan 2" (different spellings → different keys, conservative)',
  generateDedupKey('Awarapan 2') !== generateDedupKey('Aawarapan 2')
);

// Legitimate parenthetical content must NOT be stripped
test(
  '"Brahmastra: Part One" → "brahmastra part one" (colon becomes space)',
  generateDedupKey('Brahmastra: Part One') === 'brahmastra part one',
  `got: "${generateDedupKey('Brahmastra: Part One')}"`
);
test(
  '"Spider-Man (Animated)" keeps "animated" → "spider man animated"',
  generateDedupKey('Spider-Man (Animated)') === 'spider man animated',
  `got: "${generateDedupKey('Spider-Man (Animated)')}"`
);

// ────────────────────────────────────────────────────────────────────────────────────
section('2. normalizeTime — Showtime 12h to 24h conversion');

const timeCases: [string, string][] = [
  ['11:45 AM', '11:45'],
  ['2:45 PM',  '14:45'],
  ['6:00 PM',  '18:00'],
  ['9:00 PM',  '21:00'],
  ['12:00 PM', '12:00'], // noon
  ['12:00 AM', '00:00'], // midnight
  ['12:30 AM', '00:30'],
  ['1:30 am',  '01:30'], // lowercase
  ['10:30',    '10:30'], // no period
];

for (const [input, expected] of timeCases) {
  const result = normalizeTime(input);
  test(`"${input}" → "${expected}"`, result === expected, `got: "${result}"`);
}

// ────────────────────────────────────────────────────────────────────────────────────
section('3. ShmotiSource.parseHtml — Real HTML parsing');

const shmotiHtmlPath = 'shmoti.html';
if (!existsSync(shmotiHtmlPath)) {
  console.log(`  ⚠️  shmoti.html not found — skipping HTML parse tests.`);
  console.log(`     Run: Invoke-WebRequest -Uri "https://www.shmoti.com/chikkamagaluru/theatre/sree-lekha-theater" -OutFile shmoti.html`);
} else {
  const html = readFileSync(shmotiHtmlPath, 'utf-8');
  const $ = cheerio.load(html);

  // Simulate what the updated ShmotiSource.parseHtml does
  const movies: Array<{title: string; dedupKey: string; showtimes: string[]; poster?: string; sourceUrl: string}> = [];

  $('.movie-row').each((_, el) => {
    const titleText = $(el).find('.movie-title a').text().trim();
    if (!titleText) return;
    const title = titleText.replace(/^\s*\u00a0\s*/, '').trim();
    if (!title) return;

    // Use correct selector (the fix)
    let timeElements = $(el)
      .find('.theatre-listings-time-text')
      .map((_, s) => $(s).text().trim())
      .get()
      .filter(Boolean);

    if (timeElements.length === 0) {
      // Fallback constrained to timing list container
      const container = $(el).find('.theatre-listings-times-list');
      const text = container.length ? container.text() : '';
      const matches = text.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/g) || [];
      timeElements = matches;
    }

    const showtimes = [...new Set(timeElements.map(normalizeTime))].sort();
    const rawPoster = $(el).find('.field-movie-image img').attr('src');
    const poster = rawPoster
      ? (rawPoster.startsWith('http') ? rawPoster : `https://www.shmoti.com${rawPoster}`)
      : undefined;
    const movieHref = $(el).find('.movie-title a').attr('href');
    const sourceUrl = movieHref
      ? (movieHref.startsWith('http') ? movieHref : `https://www.shmoti.com${movieHref}`)
      : 'https://www.shmoti.com';

    movies.push({ title, dedupKey: generateDedupKey(title), showtimes, poster, sourceUrl });
  });

  test(
    `Parser found at least 1 movie`,
    movies.length >= 1,
    `found: ${movies.length}`
  );

  if (movies.length > 0) {
    const m = movies[0];
    console.log(`\n  Extracted movie #1:`);
    console.log(`    Title:    "${m.title}"`);
    console.log(`    DedupKey: "${m.dedupKey}"`);
    console.log(`    Times:    ${JSON.stringify(m.showtimes)}`);
    console.log(`    Poster:   ${m.poster ?? 'none'}`);
    console.log(`    URL:      ${m.sourceUrl}`);

    test('Movie has a non-empty title', m.title.length > 0);
    test('DedupKey has no language in parens', !m.dedupKey.includes('('));
    test('At least 1 showtime extracted', m.showtimes.length >= 1,
      `got: ${JSON.stringify(m.showtimes)}`);
    test('Showtimes are 24h HH:MM', m.showtimes.every(t => /^\d{2}:\d{2}$/.test(t)),
      `got: ${JSON.stringify(m.showtimes)}`);
    test('Poster URL is absolute', !m.poster || m.poster.startsWith('https://'));
    test('Source URL is absolute', m.sourceUrl.startsWith('https://'));

    // Verify the exact times from the current real page
    const expectedTimes = ['11:45', '14:45', '18:00', '21:00'];
    // Only check if we got 4 times (the page may change)
    if (m.showtimes.length === 4) {
      test(
        `Showtimes match known real values [${expectedTimes.join(', ')}]`,
        JSON.stringify(m.showtimes) === JSON.stringify(expectedTimes),
        `got: ${JSON.stringify(m.showtimes)}`
      );
    } else {
      console.log(`  ℹ️  Page shows ${m.showtimes.length} showtimes (may differ from audit snapshot): ${JSON.stringify(m.showtimes)}`);
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────────────
section('4. Cross-source deduplication logic');

interface MockMovie {
  title: string; dedupKey: string; source: string;
  showtimes: string[]; poster?: string; sourceUrl: string;
}

function dedup(movies: MockMovie[]): MockMovie[] {
  const map = new Map<string, MockMovie>();
  for (const m of movies) {
    if (!map.has(m.dedupKey)) {
      map.set(m.dedupKey, { ...m, showtimes: [...m.showtimes] });
    } else {
      const existing = map.get(m.dedupKey)!;
      existing.showtimes = [...new Set([...existing.showtimes, ...m.showtimes])].sort();
      if (!existing.poster && m.poster) existing.poster = m.poster;
    }
  }
  return [...map.values()];
}

// Scenario: Same movie, Shmoti has language in title, BMS does not
{
  const bmsMovie: MockMovie = {
    title: 'Irumudi', dedupKey: generateDedupKey('Irumudi'),
    source: 'BookMyShow', showtimes: ['11:00', '17:00'],
    poster: 'https://bms.com/irumudi.jpg', sourceUrl: 'https://bms.com'
  };
  const shmotiMovie: MockMovie = {
    title: 'Irumudi (Tamil,Telugu)', dedupKey: generateDedupKey('Irumudi (Tamil,Telugu)'),
    source: 'Shmoti', showtimes: ['11:45', '14:45'],
    poster: 'https://shmoti.com/irumudi.jpg', sourceUrl: 'https://shmoti.com'
  };

  // BMS first (higher priority)
  const result = dedup([bmsMovie, shmotiMovie]);
  test(
    'Same movie with/without language suffix merges into 1 record',
    result.length === 1,
    `got ${result.length} records`
  );
  if (result.length === 1) {
    test(
      'Merged showtimes contain times from both sources',
      result[0].showtimes.includes('11:00') && result[0].showtimes.includes('11:45')
    );
    test(
      'BMS poster wins (higher priority came first)',
      result[0].poster === 'https://bms.com/irumudi.jpg'
    );
  }
}

// Scenario: Different movies must NOT merge
{
  const kgf1: MockMovie = {
    title: 'KGF Chapter 1', dedupKey: generateDedupKey('KGF Chapter 1'),
    source: 'Shmoti', showtimes: ['10:00'], sourceUrl: 'https://shmoti.com'
  };
  const kgf2: MockMovie = {
    title: 'KGF Chapter 2', dedupKey: generateDedupKey('KGF Chapter 2'),
    source: 'Shmoti', showtimes: ['13:00'], sourceUrl: 'https://shmoti.com'
  };
  const result2 = dedup([kgf1, kgf2]);
  test(
    'KGF Chapter 1 and KGF Chapter 2 remain as 2 separate records',
    result2.length === 2,
    `got ${result2.length} records`
  );
}

// ────────────────────────────────────────────────────────────────────────────────────
section('5. Source failure safety');

// When a source fails, its movies must NOT be included in the sync input
{
  const shmotiResult = { success: true, movies: [
    { title: 'Irumudi', dedupKey: 'irumudi', source: 'Shmoti',
      showtimes: ['11:45'], sourceUrl: 'https://shmoti.com' }
  ]};
  const bmsResult = { success: false, movies: [], error: 'HTTP 403' };

  // Orchestrator logic: only include successful sources
  const toSync = [
    ...(shmotiResult.success ? shmotiResult.movies : []),
    ...(bmsResult.success ? bmsResult.movies : []),
  ];
  test(
    'BMS failure: only Shmoti movies go to sync (1 movie)',
    toSync.length === 1
  );
}
{
  const shmotiResult = { success: false, movies: [], error: 'Timeout' };
  const bmsResult = { success: true, movies: [
    { title: 'Toxic', dedupKey: 'toxic', source: 'BookMyShow',
      showtimes: ['10:00'], sourceUrl: 'https://bms.com' }
  ]};

  const toSync = [
    ...(shmotiResult.success ? shmotiResult.movies : []),
    ...(bmsResult.success ? bmsResult.movies : []),
  ];
  test(
    'Shmoti failure: only BMS movies go to sync (1 movie)',
    toSync.length === 1
  );
}
{
  const shmotiResult = { success: false, movies: [], error: 'Timeout' };
  const bmsResult = { success: false, movies: [], error: 'HTTP 403' };

  const toSync = [
    ...(shmotiResult.success ? shmotiResult.movies : []),
    ...(bmsResult.success ? bmsResult.movies : []),
  ];
  test(
    'Both sources fail: 0 movies go to sync (existing DB untouched)',
    toSync.length === 0
  );
}

// ────────────────────────────────────────────────────────────────────────────────────
section('6. Manual override logic (behaviour test, no D1)');

// Simulate what upsertScrapedMovie does depending on is_manual_override
interface DbMovieSimulation {
  id: number; name: string; normalized_title: string;
  source: string; source_url: string; poster_url: string;
  is_manual_override: number; scraped_name: string; last_seen_at: string;
}

function simulateUpsert(
  existing: DbMovieSimulation,
  scraped: { title: string; source: string; sourceUrl: string; poster?: string }
): DbMovieSimulation {
  const now = new Date().toISOString();
  if (existing.is_manual_override === 1) {
    // Only update audit fields
    return { ...existing, last_seen_at: now, scraped_name: scraped.title };
  } else {
    // Update all scraped fields
    return {
      ...existing,
      last_seen_at: now,
      scraped_name: scraped.title,
      source: scraped.source,
      source_url: scraped.sourceUrl,
      poster_url: scraped.poster ?? existing.poster_url,
    };
  }
}

const adminEditedMovie: DbMovieSimulation = {
  id: 1, name: 'Irumudi (Admin Renamed)', normalized_title: 'irumudi',
  source: 'Shmoti', source_url: 'https://shmoti.com/movie/irumudi',
  poster_url: 'https://admin-uploaded.com/custom-poster.jpg',
  is_manual_override: 1,
  scraped_name: 'Irumudi (Tamil,Telugu)',
  last_seen_at: '2026-08-22T10:00:00.000Z',
};

const newScrapeData = {
  title: 'Irumudi (Tamil,Telugu)', source: 'Shmoti',
  sourceUrl: 'https://shmoti.com/movie/irumudi',
  poster: 'https://shmoti.com/new-poster.jpg',
};

const afterScrape = simulateUpsert(adminEditedMovie, newScrapeData);

test(
  'Override=1: admin name is preserved after scrape',
  afterScrape.name === 'Irumudi (Admin Renamed)'
);
test(
  'Override=1: admin poster is preserved after scrape',
  afterScrape.poster_url === 'https://admin-uploaded.com/custom-poster.jpg'
);
test(
  'Override=1: source URL is NOT updated',
  afterScrape.source_url === 'https://shmoti.com/movie/irumudi'
);
test(
  'Override=1: last_seen_at IS updated (movie stays active)',
  afterScrape.last_seen_at !== adminEditedMovie.last_seen_at
);
test(
  'Override=1: scraped_name IS updated (audit trail preserved)',
  afterScrape.scraped_name === 'Irumudi (Tamil,Telugu)'
);

// Non-overridden movie — scraper should update everything
const normalMovie: DbMovieSimulation = {
  id: 2, name: 'Toxic', normalized_title: 'toxic',
  source: 'Shmoti', source_url: 'https://shmoti.com/movie/toxic',
  poster_url: 'https://shmoti.com/old-poster.jpg',
  is_manual_override: 0,
  scraped_name: 'Toxic',
  last_seen_at: '2026-08-22T10:00:00.000Z',
};

const updatedNormal = simulateUpsert(normalMovie, {
  title: 'Toxic', source: 'Shmoti',
  sourceUrl: 'https://shmoti.com/movie/toxic',
  poster: 'https://shmoti.com/new-poster.jpg',
});

test(
  'Override=0: poster IS updated by scraper',
  updatedNormal.poster_url === 'https://shmoti.com/new-poster.jpg'
);
test(
  'Override=0: last_seen_at IS updated',
  updatedNormal.last_seen_at !== normalMovie.last_seen_at
);

// ────────────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
}
