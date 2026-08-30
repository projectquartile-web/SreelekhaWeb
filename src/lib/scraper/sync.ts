import { NormalizedMovieData } from './types';
import { upsertScrapedMovie, upsertShows } from '../db';

/** Returns today's date as YYYY-MM-DD in the Asia/Kolkata timezone. */
function getTodayIST(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  let year = '', month = '', day = '';
  for (const p of parts) {
    if (p.type === 'year')  year  = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day')   day   = p.value;
  }
  return `${year}-${month}-${day}`;
}

export interface SyncStats {
  created:   number;
  updated:   number;
  unchanged: number;
  skipped:   number;
  errors:    number;
}

/**
 * Synchronise a deduplicated list of movies into D1.
 *
 * Safety guarantees:
 *  - Idempotent: running twice with identical input produces identical DB state.
 *  - Never deletes movies. Movies absent from the current list keep their rows;
 *    only their last_seen_at is not refreshed (stale-detection via this field).
 *  - Respects is_manual_override: see db.ts/upsertScrapedMovie for the contract.
 *  - Per-movie errors are caught individually; one failure does not abort others.
 *
 * Caller responsibility:
 *  Pass only movies from SUCCESSFUL source fetches. Failed sources must be
 *  filtered out before calling syncMovies() so their absence does not
 *  implicitly "remove" movies from the scrape result set.
 */
export async function syncMovies(movies: NormalizedMovieData[]): Promise<SyncStats> {
  const stats: SyncStats = {
    created:   0,
    updated:   0,
    unchanged: 0,
    skipped:   0,
    errors:    0,
  };

  const today = getTodayIST();

  for (const movie of movies) {
    if (!movie.dedupKey) {
      console.warn(`[sync] Skipping movie with empty dedupKey: "${movie.title}"`);
      stats.skipped++;
      continue;
    }

    try {
      const dbMovie = await upsertScrapedMovie(
        movie.title,
        movie.dedupKey,
        movie.source,
        movie.sourceUrl,
        movie.poster,
      );

      stats.updated++;

      // Only write shows when the source returned times.
      // An empty array means "source didn't give us times" — we preserve
      // whatever shows already exist rather than wiping them.
      if (movie.showtimes.length > 0) {
        await upsertShows(dbMovie.id, today, movie.showtimes);
      }

    } catch (e) {
      console.error(`[sync] Failed to sync "${movie.title}":`, e);
      stats.errors++;
    }
  }

  return stats;
}
