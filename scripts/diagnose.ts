// scripts/diagnose.ts
// Standalone diagnostic script that runs entirely in Node.js without hitting the dev server.
// Tests: HTML parsing, normalization, deduplication logic.
// No D1 calls.

import * as cheerio from 'cheerio';
import { createReadStream } from 'fs';
import { readFileSync } from 'fs';

// ---- inline the normalize functions for standalone use ----
function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase();
  normalized = normalized.replace(/[\(\[\{]?\d{4}[\)\]\}]?/g, '');
  normalized = normalized.replace(/\b(2d|3d|4dx|imax)\b/gi, '');
  normalized = normalized.replace(/\((kannada|hindi|english|telugu|tamil|malayalam)\)/gi, '');
  normalized = normalized.replace(/[^a-z0-9\s]/gi, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

function normalizeTime(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!match) return time.trim();
  let [_, hoursStr, minutes, period] = match;
  let hours = parseInt(hoursStr, 10);
  if (period && period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  else if (period && period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// ---- test cases ----
console.log("=== NORMALIZATION TESTS ===\n");

const normTests = [
  ["Irumudi (Tamil,Telugu)", "irumudi tamil telugu"],
  ["AAWARAPAN 2", "aawarapan 2"],
  ["Aawarapan 2 (2026)", "aawarapan 2"],
  ["Awarapan 2", "awarapan 2"], // Note: different word, intentionally should NOT match "aawarapan"
  ["Toxic (Hindi,Kannada,Malyalam,Tamil,Telugu)", "toxic hindi kannada malyalam tamil telugu"], // multi-language
  ["TOXIC - The Last Agent", "toxic the last agent"],
  ["KGF Chapter 2 3D", "kgf chapter 2"],
  ["Devara Part 1 (2024)", "devara part 1"],
  ["  Extra   Spaces  ", "extra spaces"],
  ["Movie: A Story (Telugu)", "movie a story"], // colon removed, Telugu tag removed
  ["Brahmastra: Part One - Shiva", "brahmastra part one shiva"],
];

let normPass = 0, normFail = 0;
for (const [input, expected] of normTests) {
  const result = normalizeTitle(input);
  const pass = result === expected;
  if (pass) {
    console.log(`  ✅ "${input}" => "${result}"`);
    normPass++;
  } else {
    console.log(`  ❌ "${input}" => "${result}" (expected: "${expected}")`);
    normFail++;
  }
}
console.log(`\nNormalization: ${normPass} pass, ${normFail} fail\n`);

// ---- time normalization tests ----
console.log("=== TIME NORMALIZATION TESTS ===\n");
const timeTests: [string, string][] = [
  ["11:45 AM", "11:45"],
  ["2:45 PM", "14:45"],
  ["6:00 PM", "18:00"],
  ["9:00 PM", "21:00"],
  ["12:00 PM", "12:00"],
  ["12:00 AM", "00:00"],
  ["1:30 am", "01:30"],
  ["10:30", "10:30"],  // no AM/PM
];

let timePass = 0, timeFail = 0;
for (const [input, expected] of timeTests) {
  const result = normalizeTime(input);
  const pass = result === expected;
  if (pass) {
    console.log(`  ✅ "${input}" => "${result}"`);
    timePass++;
  } else {
    console.log(`  ❌ "${input}" => "${result}" (expected: "${expected}")`);
    timeFail++;
  }
}
console.log(`\nTime Normalization: ${timePass} pass, ${timeFail} fail\n`);

// ---- Shmoti HTML parsing test (against real downloaded HTML) ----
console.log("=== SHMOTI HTML PARSE TEST ===\n");
try {
  const html = readFileSync('shmoti.html', 'utf-8');
  const $ = cheerio.load(html);
  
  const movies: any[] = [];
  
  $('.movie-row').each((_, el) => {
    const titleText = $(el).find('.movie-title a').text().trim();
    if (!titleText) return;
    
    // BUG 1: The regex in Phase 1 tries to strip "fa-film" content, but cheerio .text() 
    // already strips HTML tags, so the icon class text won't appear. Let's verify:
    console.log(`  Raw title text from cheerio: "${titleText}"`);
    
    // The current code does: titleText.replace(/^[\s\S]*?fa-film[\s\S]*?;\s*/, '') 
    // which won't match anything since the HTML tags are stripped. So rawTitle = titleText.
    const rawTitle = titleText.replace(/^[\s\S]*?fa-film[\s\S]*?;\s*/, '').trim() || titleText;
    console.log(`  After raw title transform: "${rawTitle}"`);
    
    const langMatch = rawTitle.match(/\((.*?)\)/);
    const language = langMatch ? langMatch[1] : '';
    console.log(`  Language extracted: "${language}"`);
    
    const posterUrl = $(el).find('.field-movie-image img').attr('src');
    console.log(`  Poster URL: ${posterUrl ? `https://www.shmoti.com${posterUrl}` : 'NONE'}`);
    
    // BUG 2: Phase 1 uses generic text regex to find showtimes.
    // The actual structure uses `.theatre-listings-time-text` - let's test both approaches:
    const approach1_generic_regex = $(el).text();
    const timeRegex = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g;
    const genericMatches = approach1_generic_regex.match(timeRegex) || [];
    console.log(`  Generic regex showtimes: [${genericMatches.map(t => `"${t}"`).join(', ')}]`);
    
    // Correct approach: use the actual class
    const correctApproach = $(el).find('.theatre-listings-time-text').map((_, s) => $(s).text().trim()).get();
    console.log(`  Correct .theatre-listings-time-text showtimes: [${correctApproach.map(t => `"${t}"`).join(', ')}]`);
    
    // Compare
    const normalizedGeneric = Array.from(new Set(genericMatches)).map(normalizeTime);
    const normalizedCorrect = Array.from(new Set(correctApproach)).map(normalizeTime);
    
    if (JSON.stringify(normalizedGeneric.sort()) === JSON.stringify(normalizedCorrect.sort())) {
      console.log(`  ✅ Both approaches produce same showtimes after normalization`);
    } else {
      console.log(`  ⚠️  Showtimes differ!`);
      console.log(`     Generic: ${JSON.stringify(normalizedGeneric)}`);
      console.log(`     Correct: ${JSON.stringify(normalizedCorrect)}`);
    }
    
    const movieUrl = $(el).find('.movie-title a').attr('href');
    
    movies.push({
      title: rawTitle,
      normalizedTitle: normalizeTitle(rawTitle),
      language,
      showtimes_generic: normalizedGeneric,
      showtimes_correct: normalizedCorrect,
      poster: posterUrl ? `https://www.shmoti.com${posterUrl}` : undefined,
      sourceUrl: movieUrl ? `https://www.shmoti.com${movieUrl}` : 'unknown',
    });
    console.log('');
  });
  
  console.log(`\n  Total movies found by Shmoti parser: ${movies.length}`);
  
  if (movies.length > 0) {
    console.log('\n  === EXTRACTED DATA ===');
    for (const m of movies) {
      console.log(`  Title: "${m.title}"`);
      console.log(`  Normalized: "${m.normalizedTitle}"`);
      console.log(`  Language: "${m.language}"`);
      console.log(`  Showtimes (correct): ${JSON.stringify(m.showtimes_correct)}`);
      console.log(`  Poster: ${m.poster || 'NONE'}`);
      console.log(`  Source URL: ${m.sourceUrl}`);
    }
  } else {
    console.log('  ❌ No movies found! Selector ".movie-row" may not match anything.');
    console.log('  Checking how many .movie-row divs exist in the HTML...');
    const count = $('.movie-row').length;
    console.log(`  .movie-row count: ${count}`);
  }
  
} catch (err) {
  console.error('  ❌ Could not read shmoti.html:', err);
}

// ---- Deduplication test ----
console.log("\n=== DEDUPLICATION TESTS ===\n");

interface Movie { title: string; normalizedTitle: string; source: string; showtimes: string[]; }

function deduplicateMovies(movies: Movie[]): Movie[] {
  const deduplicated = new Map<string, Movie>();
  for (const m of movies) {
    if (!deduplicated.has(m.normalizedTitle)) {
      deduplicated.set(m.normalizedTitle, { ...m });
    } else {
      const existing = deduplicated.get(m.normalizedTitle)!;
      if (m.source === 'BookMyShow') {
        m.showtimes = Array.from(new Set([...existing.showtimes, ...m.showtimes]));
        deduplicated.set(m.normalizedTitle, m);
      } else {
        existing.showtimes = Array.from(new Set([...existing.showtimes, ...m.showtimes]));
      }
    }
  }
  return Array.from(deduplicated.values());
}

const dupeTests = [
  {
    desc: "Same movie from Shmoti and BookMyShow, different showtimes",
    input: [
      { title: "Irumudi (Tamil,Telugu)", normalizedTitle: normalizeTitle("Irumudi (Tamil,Telugu)"), source: "Shmoti", showtimes: ["11:45", "14:45"] },
      { title: "Irumudi", normalizedTitle: normalizeTitle("Irumudi"), source: "BookMyShow", showtimes: ["11:00", "17:00"] },
    ],
    expectedCount: 2, // They have DIFFERENT normalized titles! "irumudi tamil telugu" vs "irumudi"
    note: "⚠️  POTENTIAL BUG: Language in title causes different normalized keys"
  },
  {
    desc: "Same movie from both sources, identical title",
    input: [
      { title: "Toxic", normalizedTitle: normalizeTitle("Toxic"), source: "Shmoti", showtimes: ["10:00", "13:00"] },
      { title: "Toxic", normalizedTitle: normalizeTitle("Toxic"), source: "BookMyShow", showtimes: ["10:00", "16:00"] },
    ],
    expectedCount: 1,
    note: "Should merge into 1 record"
  },
];

for (const test of dupeTests) {
  const result = deduplicateMovies(test.input as Movie[]);
  const pass = result.length === test.expectedCount;
  console.log(`  Test: ${test.desc}`);
  console.log(`  Input movies: ${test.input.map(m => `"${m.normalizedTitle}" [${m.source}]`).join(', ')}`);
  console.log(`  Result count: ${result.length} (expected: ${test.expectedCount})`);
  if (test.note) console.log(`  Note: ${test.note}`);
  if (result.length === 1) {
    console.log(`  Merged showtimes: ${JSON.stringify(result[0].showtimes)}`);
  }
  console.log(`  ${pass ? '✅' : '⚠️ '} ${test.desc}`);
  console.log('');
}
