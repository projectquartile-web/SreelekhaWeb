import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionJWT, getCookieName } from '@/lib/auth';
import { runScraper } from '@/lib/scraper';

/**
 * Authentication for the scrape endpoint.
 *
 * Accepts two forms of authentication (either is sufficient):
 *
 * 1. Session cookie (sl_admin_session):
 *    The same JWT cookie used by the admin dashboard.
 *    Used when triggering from the admin UI (future Phase 3).
 *
 * 2. Bearer token (Authorization: Bearer <SCRAPE_SECRET>):
 *    A pre-shared secret from the SCRAPE_SECRET environment variable.
 *    Used by `npm run scrape` from the local development terminal.
 *    The secret is NOT a user password — it is a random token, never committed to Git.
 *
 * Both forms require server-side verification. Middleware does not protect /api/ routes,
 * so this check must live here.
 *
 * An unauthenticated request returns 401 and does NOT trigger any scraping.
 */
async function isAuthorized(request: Request): Promise<boolean> {
  // ── Option 1: Session cookie (admin dashboard) ────────────────────────────
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getCookieName());
  const sessionSecret = process.env.SESSION_SECRET;

  if (sessionCookie && sessionSecret) {
    const valid = await verifySessionJWT(sessionCookie.value, sessionSecret);
    if (valid) return true;
  }

  // ── Option 2: Bearer token (CLI scrape script) ────────────────────────────
  const scrapeSecret = process.env.SCRAPE_SECRET;
  if (scrapeSecret) {
    const authHeader = request.headers.get('Authorization') ?? '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token === scrapeSecret) {
      return true;
    }
  }

  return false;
}

/**
 * GET /api/admin/scrape
 *
 * Triggers the movie-data scraper and synchronises results into D1.
 * Requires authentication (see isAuthorized above).
 *
 * Security notes:
 * - Does NOT accept any URL parameter. Sources are hardcoded in the adapters.
 * - Does NOT expose raw scraped HTML or internal error details to the response.
 * - SSRF: impossible — no user-supplied URLs are ever fetched.
 * - Rate limiting: not implemented here; add at Cloudflare WAF level for production.
 */
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const results = await runScraper();
    return NextResponse.json(results);
  } catch (error) {
    // Log full error server-side; return a generic message to the client.
    console.error('[/api/admin/scrape] Scraper run failed unexpectedly:', error);
    return NextResponse.json(
      { error: 'Scraper failed. Check server logs.' },
      { status: 500 }
    );
  }
}
