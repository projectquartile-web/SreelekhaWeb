import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

export interface Movie {
  id: number;
  /** Admin-editable display title. Set to scraped_name on first insert; admin may rename. */
  name: string;
  /**
   * Deduplication key: title stripped of language/format annotations, lowercased.
   * Used to identify the same film across sources (e.g. "irumudi").
   * Never updated after insert by the scraper — only the admin migration path changes this.
   */
  normalized_title?: string | null;
  /** Which source last updated this record */
  source?: string | null;
  /** Source-specific URL for the movie page */
  source_url?: string | null;
  /** ISO timestamp of the last successful scrape that saw this movie */
  last_seen_at?: string | null;
  /** Scraped poster image URL */
  poster_url?: string | null;
  /** YouTube video ID (set by Phase 2 auto-discovery or Phase 3 admin override) */
  youtube_trailer_id?: string | null;
  /**
   * Manual override flag (SQLite integer: 0 = automatic, 1 = admin-controlled).
   * When 1, the scraper will NOT overwrite: source, source_url, poster_url.
   * The scraper WILL still update: last_seen_at, scraped_name (audit trail).
   */
  is_manual_override?: number | null;
  /**
   * The raw title string from the scraper as of the last scrape.
   * Always updated by the scraper regardless of is_manual_override.
   * Allows admins to see what the scraper found even when override is active.
   */
  scraped_name?: string | null;
  youtube_trailer_is_manual_override?: number | null;
  /**
   * The confidence score of the automatically discovered trailer.
   * Used to determine if a newly discovered trailer is substantially better (+20).
   */
  youtube_trailer_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Show {
  id: number;
  movie_id: number;
  show_date: string;
  show_time: string;
  is_manual_override?: number | null;
  created_at: string;
  updated_at: string;
}

export interface MovieWithShows extends Movie {
  shows: Show[];
}

function getDb(): D1Database {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error("D1 database binding 'DB' not found in environment.");
  }
  return env.DB as unknown as D1Database;
}

export async function getSchedule(date: string): Promise<MovieWithShows[]> {
  const db = getDb();
  
  // Enable foreign keys
  await db.prepare("PRAGMA foreign_keys = ON;").run();

  const moviesResult = await db.prepare(
    "SELECT DISTINCT m.* FROM movies m JOIN shows s ON m.id = s.movie_id WHERE s.show_date = ? ORDER BY m.name ASC"
  ).bind(date).all<Movie>();

  const showsResult = await db.prepare(
    "SELECT * FROM shows WHERE show_date = ? ORDER BY show_time ASC"
  ).bind(date).all<Show>();

  const movies = moviesResult.results || [];
  const shows = showsResult.results || [];

  return movies.map((movie: Movie) => ({
    ...movie,
    shows: shows.filter((show: Show) => show.movie_id === movie.id)
  }));
}

export async function getMovies(): Promise<Movie[]> {
  const db = getDb();
  const result = await db.prepare("SELECT * FROM movies ORDER BY name ASC").all<Movie>();
  return result.results || [];
}

export async function getShowsForDate(movieId: number, date: string): Promise<Show[]> {
  const db = getDb();
  const result = await db.prepare(
    "SELECT * FROM shows WHERE movie_id = ? AND show_date = ? ORDER BY show_time ASC"
  ).bind(movieId, date).all<Show>();
  return result.results || [];
}

export async function createMovie(name: string): Promise<Movie> {
  const db = getDb();
  const result = await db.prepare(
    "INSERT INTO movies (name) VALUES (?) RETURNING *"
  ).bind(name).first<Movie>();
  if (!result) throw new Error("Failed to create movie");
  return result;
}

export async function updateMovie(id: number, name: string): Promise<void> {
  const db = getDb();
  await db.prepare(
    "UPDATE movies SET name = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(name, id).run();
}

export async function deleteMovie(id: number): Promise<void> {
  const db = getDb();
  await db.prepare("PRAGMA foreign_keys = ON;").run();
  await db.prepare("DELETE FROM movies WHERE id = ?").bind(id).run();
}

export async function upsertShows(movieId: number, date: string, times: string[], isManualOverride: boolean = false): Promise<void> {
  const db = getDb();
  await db.prepare("PRAGMA foreign_keys = ON;").run();

  if (isManualOverride) {
    // Admin is forcibly setting the schedule for this movie/date.
    // Wipe everything and insert as manual overrides.
    await db.prepare(
      "DELETE FROM shows WHERE movie_id = ? AND show_date = ?"
    ).bind(movieId, date).run();

    if (times.length > 0) {
      const stmts = times.map(time => 
        db.prepare(
          "INSERT INTO shows (movie_id, show_date, show_time, is_manual_override) VALUES (?, ?, ?, 1)"
        ).bind(movieId, date, time)
      );
      await db.batch(stmts);
    }
  } else {
    // Scraper is updating.
    // 1. Fetch existing manual shows to avoid duplicates.
    const manualShows = await db.prepare(
      "SELECT show_time FROM shows WHERE movie_id = ? AND show_date = ? AND is_manual_override = 1"
    ).bind(movieId, date).all<{show_time: string}>();
    
    const manualTimes = new Set((manualShows.results || []).map(s => s.show_time));

    // 2. Delete existing SCRAPED shows (do not touch manual ones).
    await db.prepare(
      "DELETE FROM shows WHERE movie_id = ? AND show_date = ? AND (is_manual_override = 0 OR is_manual_override IS NULL)"
    ).bind(movieId, date).run();

    // 3. Insert new scraped shows that don't match manual times.
    const timesToInsert = times.filter(time => !manualTimes.has(time));
    if (timesToInsert.length > 0) {
      const stmts = timesToInsert.map(time => 
        db.prepare(
          "INSERT INTO shows (movie_id, show_date, show_time, is_manual_override) VALUES (?, ?, ?, 0)"
        ).bind(movieId, date, time)
      );
      await db.batch(stmts);
    }
  }
}

/**
 * Upsert a scraped movie into D1.
 *
 * Deduplication key: normalized_title (the dedupKey from the scraper).
 *
 * Manual override protection:
 *   - When is_manual_override = 1, the scraper must NOT overwrite:
 *     source, source_url, poster_url, name
 *   - The scraper ALWAYS updates: last_seen_at, scraped_name
 *   - This ensures stale-detection continues working while respecting admin edits.
 *
 * On first insert: name is set to the scraped title (admin can rename later).
 * On update with override=0: source metadata is refreshed.
 * On update with override=1: only audit fields are refreshed.
 */
export async function upsertScrapedMovie(
  title: string,
  dedupKey: string,
  source: string,
  sourceUrl: string,
  posterUrl: string | undefined
): Promise<Movie> {
  const db = getDb();

  const existing = await db.prepare(
    "SELECT * FROM movies WHERE normalized_title = ?"
  ).bind(dedupKey).first<Movie>();

  const now = new Date().toISOString();

  if (existing) {
    const isOverride = existing.is_manual_override === 1;

    if (isOverride) {
      // Admin has locked this movie. Only update audit trail fields.
      // Do NOT touch: source, source_url, poster_url, name.
      await db.prepare(
        `UPDATE movies
         SET last_seen_at  = ?,
             scraped_name  = ?,
             updated_at    = datetime('now')
         WHERE id = ?`
      ).bind(now, title, existing.id).run();
    } else {
      // Normal automatic update. Refresh all scraped fields.
      // poster_url: keep existing value if scraper provided none (COALESCE).
      await db.prepare(
        `UPDATE movies
         SET last_seen_at  = ?,
             scraped_name  = ?,
             source        = ?,
             source_url    = ?,
             poster_url    = COALESCE(?, poster_url),
             updated_at    = datetime('now')
         WHERE id = ?`
      ).bind(now, title, source, sourceUrl, posterUrl ?? null, existing.id).run();
    }

    const updated = await db.prepare(
      "SELECT * FROM movies WHERE id = ?"
    ).bind(existing.id).first<Movie>();
    return updated!;

  } else {
    // New movie — insert with all scraped fields.
    const result = await db.prepare(
      `INSERT INTO movies
         (name, normalized_title, source, source_url, poster_url, last_seen_at, scraped_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(
      title,           // name = scraped title initially
      dedupKey,
      source,
      sourceUrl,
      posterUrl ?? null,
      now,
      title            // scraped_name = same as name on first insert
    ).first<Movie>();

    if (!result) throw new Error("Failed to insert scraped movie");
    return result;
  }
}

/**
 * Updates a movie's YouTube trailer ID if it passes override and score checks.
 */
export async function updateMovieTrailer(
  movieId: number,
  trailerId: string,
  score: number
): Promise<boolean> {
  const db = getDb();
  
  const existing = await db.prepare(
    "SELECT youtube_trailer_is_manual_override, youtube_trailer_score FROM movies WHERE id = ?"
  ).bind(movieId).first<Movie>();

  if (!existing) return false;

  // Never overwrite manual trailers
  if (existing.youtube_trailer_is_manual_override === 1) {
    return false;
  }

  // If there's an existing automatic trailer, only replace it if the new score is substantially better (>= 20 points higher)
  const currentScore = existing.youtube_trailer_score || 0;
  if (currentScore > 0 && score < currentScore + 20) {
    return false;
  }

  await db.prepare(
    `UPDATE movies 
     SET youtube_trailer_id = ?, 
         youtube_trailer_score = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).bind(trailerId, score, movieId).run();

  return true;
}

export interface SyncLogInput {
  shmoti_status: string;
  bms_status: string;
  youtube_status: string;
  movies_created: number;
  movies_updated: number;
  movies_unchanged: number;
  shows_added: number;
  shows_updated: number;
  shows_removed: number;
  trailers_discovered: number;
  trailers_skipped: number;
  trailers_failed: number;
}

export async function insertSyncLog(log: SyncLogInput): Promise<void> {
  const db = getDb();
  await db.prepare(
    `INSERT INTO sync_logs (
      created_at, shmoti_status, bms_status, youtube_status,
      movies_created, movies_updated, movies_unchanged,
      shows_added, shows_updated, shows_removed,
      trailers_discovered, trailers_skipped, trailers_failed
    ) VALUES (
      datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`
  ).bind(
    log.shmoti_status, log.bms_status, log.youtube_status,
    log.movies_created, log.movies_updated, log.movies_unchanged,
    log.shows_added, log.shows_updated, log.shows_removed,
    log.trailers_discovered, log.trailers_skipped, log.trailers_failed
  ).run();
}

export async function getRecentSyncLog(): Promise<any> {
  const db = getDb();
  const result = await db.prepare(
    "SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 1"
  ).first();
  return result;
}

