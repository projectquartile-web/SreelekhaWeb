/**
 * Types for the scraper system.
 */

export interface NormalizedMovieData {
  /** The raw display title as extracted from the source (e.g. "Irumudi (Tamil,Telugu)") */
  title: string;
  /**
   * The deduplication key: title stripped of language/format annotations, lowercased.
   * Used for cross-source matching. Two movies with the same dedupKey are the same movie.
   * E.g. "Irumudi (Tamil,Telugu)" and "Irumudi" both produce dedupKey "irumudi".
   */
  dedupKey: string;
  language?: string;
  showtimes: string[];
  poster?: string;
  source: string;
  sourceUrl: string;
  sourceIdentifier?: string;
}

/**
 * Result returned by a source adapter's fetchMovies().
 * Distinguishes a clean empty result (no movies today) from a fetch/parse failure.
 */
export interface SourceFetchResult {
  success: boolean;
  movies: NormalizedMovieData[];
  /** Present only when success is false */
  error?: string;
  /** Whether failure was specifically a network timeout */
  timedOut?: boolean;
}

export interface MovieSource {
  name: string;
  fetchMovies(): Promise<SourceFetchResult>;
}
