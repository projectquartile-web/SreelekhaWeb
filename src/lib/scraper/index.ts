import { ShmotiSource } from './sources/shmoti';
import { BookMyShowSource } from './sources/bookmyshow';
import { syncMovies } from './sync';
import { NormalizedMovieData, SourceFetchResult } from './types';
import { getMovies, updateMovieTrailer, insertSyncLog } from '../db';
import { discoverTrailer } from './youtube';

export interface ScraperSourceResult {
  source: string;
  success: boolean;
  moviesFound: number;
  movies: string[]; // dedupKeys for logging
  error?: string;
  timedOut?: boolean;
}

export interface ScraperRunResult {
  sourceResults: ScraperSourceResult[];
  normalized: string[];  // dedupKeys of the merged, deduplicated set
  stats: import('./sync').SyncStats;
  trailers: {
    discovered: number;
    rejected: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Runs all source adapters, deduplicates movies across sources, and syncs to D1.
 *
 * Source priority for conflict resolution:
 *   BookMyShow > Shmoti
 *
 * Rationale: BMS is a ticketing platform with direct booking integration and
 * typically has more reliable show data. Shmoti is a local aggregator.
 * When both sources have the same movie (matched by dedupKey), BMS metadata
 * (poster, sourceUrl) takes precedence. Showtimes are unioned from both.
 *
 * Source failure safety:
 *   If a source fails (success: false), its movies are excluded from the sync.
 *   Movies already in D1 from a prior scrape of that source are untouched.
 *   A source returning 0 movies (success: true, empty array) IS included in
 *   the sync as a legitimate "no movies today" result.
 *
 * SSRF protection:
 *   Source URLs are hardcoded in each adapter class. This function never accepts
 *   user-supplied URLs. Do not add any URL parameter or redirect here.
 */
export async function runScraper(): Promise<ScraperRunResult> {
  // Sources are declared in priority order: higher priority first.
  // When the same movie appears in multiple sources, the first one in this list
  // that successfully fetched the movie wins for metadata (poster, sourceUrl).
  const sources = [
    new BookMyShowSource(),
    new ShmotiSource(),
  ];

  const sourceResults: ScraperSourceResult[] = [];
  // Collect movies from successful sources only
  const successfulMovies: NormalizedMovieData[] = [];

  for (const source of sources) {
    let result: SourceFetchResult;
    try {
      result = await source.fetchMovies();
    } catch (e) {
      // fetchMovies() should never throw (it returns SourceFetchResult with success:false),
      // but guard against unexpected exceptions in the adapter itself.
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[scraper] Unhandled exception from ${source.name}:`, e);
      result = { success: false, movies: [], error: msg };
    }

    sourceResults.push({
      source: source.name,
      success: result.success,
      moviesFound: result.movies.length,
      movies: result.movies.map(m => m.dedupKey),
      error: result.error,
      timedOut: result.timedOut,
    });

    if (result.success) {
      successfulMovies.push(...result.movies);
    } else {
      console.warn(
        `[scraper] ${source.name} failed — its movies will NOT be synced this run. ` +
        `Existing DB data from this source is preserved.`
      );
    }
  }

  // ── Deduplication ────────────────────────────────────────────────────────
  // Build a dedupKey → NormalizedMovieData map, respecting source priority.
  // Sources are processed in priority order (BMS first), so the first entry
  // for a given dedupKey wins for metadata. Showtimes are unioned from all sources.
  const deduplicated = new Map<string, NormalizedMovieData>();

  for (const movie of successfulMovies) {
    if (!deduplicated.has(movie.dedupKey)) {
      // First time we see this movie — store a copy so mutations don't affect source arrays
      deduplicated.set(movie.dedupKey, { ...movie, showtimes: [...movie.showtimes] });
    } else {
      // Same movie from a lower-priority source — merge showtimes only.
      const existing = deduplicated.get(movie.dedupKey)!;
      const merged = new Set([...existing.showtimes, ...movie.showtimes]);
      existing.showtimes = [...merged].sort();
      // Poster: keep existing (higher-priority source) if it has one; otherwise take new one.
      if (!existing.poster && movie.poster) {
        existing.poster = movie.poster;
      }
    }
  }

  const mergedMovies = Array.from(deduplicated.values());

  // ── D1 Sync ──────────────────────────────────────────────────────────────
  const stats = await syncMovies(mergedMovies);

  // ── YouTube Trailer Discovery ────────────────────────────────────────────
  const trailerStats = { discovered: 0, rejected: 0, skipped: 0, failed: 0 };
  
  try {
    const allMovies = await getMovies();
    for (const m of allMovies) {
      if (m.youtube_trailer_is_manual_override === 1) {
        trailerStats.skipped++;
        continue;
      }
      
      const result = await discoverTrailer(m.normalized_title || m.name);
      
      if (result.reason === 'discovered' && result.trailerId) {
        const updated = await updateMovieTrailer(m.id, result.trailerId, result.score);
        if (updated) {
          trailerStats.discovered++;
        } else {
          trailerStats.skipped++; // Didn't meet the +20 requirement or similar
        }
      } else if (result.reason === 'rejected_low_confidence') {
        trailerStats.rejected++;
      } else if (result.reason === 'failed') {
        trailerStats.failed++;
      }
    }
  } catch (e) {
    console.error("[scraper] YouTube discovery top-level error:", e);
  }

  // ── Logging ──────────────────────────────────────────────────────────────
  const shmotiResult = sourceResults.find(r => r.source === 'Shmoti');
  const bmsResult = sourceResults.find(r => r.source === 'BookMyShow');

  let shmotiStatus = 'UNKNOWN';
  if (shmotiResult) {
    shmotiStatus = shmotiResult.success ? 'SUCCESS' : (shmotiResult.error || 'FAILED');
  }

  let bmsStatus = 'UNKNOWN';
  if (bmsResult) {
    if (!bmsResult.success && bmsResult.error?.includes('403')) {
      bmsStatus = 'BLOCKED / 403';
    } else {
      bmsStatus = bmsResult.success ? 'SUCCESS' : (bmsResult.error || 'FAILED');
    }
  }

  let youtubeStatus = trailerStats.failed > 0 ? 'ERROR' : 'SUCCESS';

  try {
    await insertSyncLog({
      shmoti_status: shmotiStatus,
      bms_status: bmsStatus,
      youtube_status: youtubeStatus,
      movies_created: stats.created,
      movies_updated: stats.updated,
      movies_unchanged: stats.unchanged,
      shows_added: 0,
      shows_updated: 0,
      shows_removed: 0,
      trailers_discovered: trailerStats.discovered,
      trailers_skipped: trailerStats.skipped,
      trailers_failed: trailerStats.failed,
    });
  } catch (e) {
    console.error("[scraper] Failed to insert sync log:", e);
  }

  return {
    sourceResults,
    normalized: mergedMovies.map(m => m.dedupKey),
    stats,
    trailers: trailerStats,
  };
}
