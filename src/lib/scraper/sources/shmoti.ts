import * as cheerio from 'cheerio';
import { MovieSource, NormalizedMovieData, SourceFetchResult } from '../types';
import { generateDedupKey, normalizeTime } from '../normalize';

/** Fetch timeout in milliseconds. Shmoti must respond within this window. */
const FETCH_TIMEOUT_MS = 10_000;

export class ShmotiSource implements MovieSource {
  name = 'Shmoti';
  private readonly url = 'https://www.shmoti.com/chikkamagaluru/theatre/sree-lekha-theater';

  async fetchMovies(): Promise<SourceFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(this.url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        const msg = `HTTP ${response.status}`;
        console.error(`[Shmoti] Request failed: ${msg}`);
        return { success: false, movies: [], error: msg };
      }

      const html = await response.text();
      const movies = this.parseHtml(html);
      return { success: true, movies };

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`[Shmoti] Request timed out after ${FETCH_TIMEOUT_MS}ms`);
        return { success: false, movies: [], error: 'Request timed out', timedOut: true };
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Shmoti] Unexpected error: ${msg}`);
      return { success: false, movies: [], error: msg };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Pure HTML parsing — separated from fetching so it can be unit-tested independently. */
  parseHtml(html: string): NormalizedMovieData[] {
    const $ = cheerio.load(html);
    const movies: NormalizedMovieData[] = [];

    $('.movie-row').each((_, el) => {
      // ── Title ──────────────────────────────────────────────────────────────
      const titleText = $(el).find('.movie-title a').text().trim();
      if (!titleText) return; // skip rows without a title

      // Shmoti sometimes prepends icon text (e.g. whitespace from Font Awesome).
      // cheerio .text() strips HTML tags, so the raw text may start with a
      // non-breaking space followed by the title. Trim it cleanly.
      const title = titleText.replace(/^\s*\u00a0\s*/, '').trim();
      if (!title) return;

      // ── Language ───────────────────────────────────────────────────────────
      // Shmoti appends language in parens: "Irumudi (Tamil,Telugu)"
      const langMatch = title.match(/\(([^)]+)\)$/);
      const language = langMatch ? langMatch[1].trim() : '';

      // ── Showtimes ──────────────────────────────────────────────────────────
      // Primary: use the precise DOM element Shmoti renders times in.
      // Fallback: generic time regex in case Shmoti changes the class name.
      let timeElements = $(el)
        .find('.theatre-listings-time-text')
        .map((_, s) => $(s).text().trim())
        .get()
        .filter(Boolean);

      if (timeElements.length === 0) {
        // Fallback: extract all HH:MM AM/PM patterns from the element text,
        // but ONLY from within the known timing list container to avoid
        // matching unrelated timestamps elsewhere on the page.
        const container = $(el).find('.theatre-listings-times-list');
        const text = container.length ? container.text() : '';
        const matches = text.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/g) || [];
        timeElements = matches;
      }

      const showtimes = [...new Set(timeElements.map(normalizeTime))].sort();

      // ── Poster ─────────────────────────────────────────────────────────────
      const rawPoster = $(el).find('.field-movie-image img').attr('src');
      const poster = rawPoster
        ? rawPoster.startsWith('http')
          ? rawPoster
          : `https://www.shmoti.com${rawPoster}`
        : undefined;

      // ── Source URL ─────────────────────────────────────────────────────────
      const movieHref = $(el).find('.movie-title a').attr('href');
      const sourceUrl = movieHref
        ? movieHref.startsWith('http')
          ? movieHref
          : `https://www.shmoti.com${movieHref}`
        : this.url;

      movies.push({
        title,
        dedupKey: generateDedupKey(title),
        language,
        showtimes,
        poster,
        source: this.name,
        sourceUrl,
        sourceIdentifier: movieHref ?? undefined,
      });
    });

    return movies;
  }
}
