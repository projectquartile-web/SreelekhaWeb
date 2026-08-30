import * as cheerio from 'cheerio';
import { MovieSource, NormalizedMovieData, SourceFetchResult } from '../types';
import { generateDedupKey, normalizeTime } from '../normalize';

/** Fetch timeout in milliseconds. */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * BookMyShow source adapter.
 *
 * STATUS: BookMyShow consistently returns HTTP 403 Forbidden due to bot-protection
 * (Cloudflare Anti-Bot / Akamai). This adapter has been written against the expected
 * HTML structure but has NEVER been validated against live BMS HTML because the
 * response is blocked.
 *
 * The adapter fails gracefully: it returns { success: false } so the orchestrator
 * can continue processing other sources without interruption.
 *
 * DO NOT attempt to bypass bot protection (no headless browser, no proxy, no
 * fingerprint spoofing). If BMS becomes accessible in the future, this adapter's
 * parseHtml() will need validation and likely revision against the real DOM.
 *
 * Target URL: https://in.bookmyshow.com/chikkamagaluru/cinemas
 * Expected HTML structure (unverified): venue blocks containing movie rows with
 * .cinema-name-wrapper, .movie-name or similar selectors.
 */
export class BookMyShowSource implements MovieSource {
  name = 'BookMyShow';
  private readonly url = 'https://in.bookmyshow.com/chikkamagaluru/cinemas';

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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        const msg = `HTTP ${response.status}`;
        console.error(`[BookMyShow] Request failed: ${msg}`);
        return { success: false, movies: [], error: msg };
      }

      const html = await response.text();
      const movies = this.parseHtml(html);
      return { success: true, movies };

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`[BookMyShow] Request timed out after ${FETCH_TIMEOUT_MS}ms`);
        return { success: false, movies: [], error: 'Request timed out', timedOut: true };
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[BookMyShow] Unexpected error: ${msg}`);
      return { success: false, movies: [], error: msg };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse BMS HTML for Sree Lekha Theatre movies.
   * NOTE: This implementation is based on expected BMS HTML structure and has NOT
   * been validated against live data due to permanent 403 bot-protection block.
   * It will need revision once real HTML is accessible.
   */
  parseHtml(html: string): NormalizedMovieData[] {
    const $ = cheerio.load(html);
    const movies: NormalizedMovieData[] = [];

    // Find the Sree Lekha venue block. BMS groups movies by cinema on the city page.
    $('.cinema-name-wrapper, [data-venue-name]').each((_, el) => {
      const cinemaText = $(el).text().toLowerCase();
      const isOurVenue =
        cinemaText.includes('sree lekha') ||
        cinemaText.includes('sri lekha') ||
        cinemaText.includes('sreelekha');

      if (!isOurVenue) return;

      // Walk up to the cinema-level container and find all movie rows within it
      const container = $(el).closest(
        '.cinema-block, .venue-container, [data-venue-id], .listing-detail-row'
      );
      const searchRoot = container.length ? container : $(el).parent();

      searchRoot.find('.movie-row, .listing-info, [data-movie-name]').each((_, movieEl) => {
        const title = $(movieEl)
          .find('.movie-name, .title, [data-movie-title]')
          .first()
          .text()
          .trim();
        if (!title) return;

        const showtimes = $(movieEl)
          .find('.showtime-pill, .time, [data-show-time]')
          .map((_, timeEl) => normalizeTime($(timeEl).text().trim()))
          .get()
          .filter(Boolean);

        movies.push({
          title,
          dedupKey: generateDedupKey(title),
          showtimes,
          source: this.name,
          sourceUrl: this.url,
        });
      });
    });

    return movies;
  }
}
