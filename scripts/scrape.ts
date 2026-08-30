/**
 * scripts/scrape.ts
 *
 * Development utility: triggers the scraper via the local dev server API
 * and formats the output in a human-readable way.
 *
 * Prerequisites:
 *   1. The Next.js dev server must be running: npm run dev
 *   2. SCRAPE_SECRET must be set in your environment (or .env.local):
 *      SCRAPE_SECRET=your-random-secret-here
 *
 * Usage:
 *   npm run scrape
 *
 * The SCRAPE_SECRET must match the SCRAPE_SECRET set in the dev server environment.
 * It is NOT committed to Git. See .env.example for setup instructions.
 */

const BASE_URL = process.env.SCRAPE_BASE_URL ?? 'http://localhost:3000';
const SCRAPE_SECRET = process.env.SCRAPE_SECRET;

async function run() {
  if (!SCRAPE_SECRET) {
    console.error(
      'Error: SCRAPE_SECRET environment variable is not set.\n' +
      'Add it to your .env.local file:\n' +
      '  SCRAPE_SECRET=your-random-secret-here\n' +
      'Then ensure the same value is set wherever the dev server runs.'
    );
    process.exit(1);
  }

  console.log('Starting scraper...');

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/admin/scrape`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SCRAPE_SECRET}`,
      },
    });
  } catch (e) {
    console.error(
      '\nFailed to connect to dev server. Is `npm run dev` running on port 3000?\n',
      e
    );
    process.exit(1);
  }

  if (res.status === 401) {
    console.error(
      '\nAuthentication failed (401). ' +
      'Make sure SCRAPE_SECRET in this terminal matches the value in the dev server environment.'
    );
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`\nServer returned ${res.status}:`);
    console.error(await res.text());
    process.exit(1);
  }

  const data = await res.json() as {
    sourceResults: Array<{
      source: string;
      success: boolean;
      moviesFound: number;
      error?: string;
      timedOut?: boolean;
    }>;
    normalized: string[];
    stats: {
      created: number;
      updated: number;
      unchanged: number;
      skipped: number;
      errors: number;
    };
  };

  for (const result of data.sourceResults) {
    console.log(`\nSource: ${result.source}`);
    if (!result.success) {
      const reason = result.timedOut ? 'Timed out' : `Error: ${result.error ?? 'unknown'}`;
      console.log(reason);
    } else {
      console.log(`Movies found: ${result.moviesFound}`);
    }
  }

  console.log('\nNormalized:');
  if (data.normalized.length === 0) {
    console.log('(none)');
  } else {
    for (const key of data.normalized) {
      console.log(key);
    }
  }

  console.log('\nD1:');
  console.log(`Created:   ${data.stats.created}`);
  console.log(`Updated:   ${data.stats.updated}`);
  console.log(`Unchanged: ${data.stats.unchanged}`);
  console.log(`Skipped:   ${data.stats.skipped}`);

  console.log('\nErrors:');
  console.log(data.stats.errors);
}

run();
