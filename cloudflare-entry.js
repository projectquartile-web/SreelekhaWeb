/**
 * cloudflare-entry.js
 *
 * Custom Cloudflare Worker entrypoint that wraps the OpenNext-generated worker
 * and adds a `scheduled` handler for Cloudflare Cron Triggers.
 *
 * ── Architecture note: why worker.fetch() and not direct runScraper() ────────
 *
 * The scraper depends on `db.ts` which calls `getCloudflareContext()` from
 * @opennextjs/cloudflare. That function reads from an AsyncLocalStorage (ALS)
 * that is populated by `runWithCloudflareRequestContext()` inside init.js.
 *
 * In a scheduled event there is no Request and the ALS store is empty.
 * Any call to getCloudflareContext() — and therefore any D1 access — would
 * throw an error immediately.
 *
 * The ONLY supported way to populate that ALS is through
 * runWithCloudflareRequestContext(request, env, ctx, handler), which requires
 * a real Request object for URL-based env initialization. That function is
 * called by worker.fetch() on every HTTP request.
 *
 * Additionally, runScraper() lives inside the compiled Next.js server bundle
 * (.open-next/server-functions/default/handler.mjs) and cannot be imported
 * directly from this entrypoint without coupling to OpenNext internals.
 *
 * Conclusion: routing the scheduled event through worker.fetch() to
 * /api/admin/scrape is the correct and safe architecture for this version
 * of @opennextjs/cloudflare. It is NOT unnecessarily indirect — it is the
 * only path that correctly initialises the D1 context.
 *
 * This design will be revisited if OpenNext exposes a runWithScheduledContext()
 * or similar utility in a future release.
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *
 * The synthetic request carries `Authorization: Bearer <SCRAPE_SECRET>`.
 * SCRAPE_SECRET must be set as a Cloudflare Secret (wrangler secret put).
 * It is never exposed to the client — this file runs only in the worker.
 * The /api/admin/scrape route validates the token server-side before running.
 *
 * ── Cron schedule ────────────────────────────────────────────────────────────
 *
 * Configured in wrangler.jsonc: "0 * * * *" — runs at :00 of every hour.
 * Execution is completely independent of website traffic.
 */

import worker from "./.open-next/worker.js";

export default {
  // Pass all HTTP traffic to the OpenNext worker unchanged.
  // This preserves all existing routes, middleware, and asset handling.
  fetch: worker.fetch,

  /**
   * Cloudflare Cron Trigger handler.
   * Called by Cloudflare at the schedule defined in wrangler.jsonc.
   * Never called by website visitors.
   */
  async scheduled(event, env, ctx) {
    if (!env.SCRAPE_SECRET) {
      console.error("[Cron] SCRAPE_SECRET is not set — cannot authenticate with scrape endpoint. Aborting.");
      return;
    }

    // Construct a synthetic internal request.
    // This routes through worker.fetch() which correctly initialises the
    // AsyncLocalStorage-based Cloudflare context (env, D1 binding, etc.)
    // required by getCloudflareContext() inside db.ts.
    const request = new Request("https://sreelekhatheatre.com/api/admin/scrape", {
      headers: {
        "Authorization": `Bearer ${env.SCRAPE_SECRET}`,
        // Signal that this is a cron invocation (informational — not used for auth).
        "X-Cron-Trigger": "1",
      },
    });

    try {
      console.log(`[Cron] Scheduled sync triggered at ${new Date().toISOString()}`);
      const response = await worker.fetch(request, env, ctx);

      if (!response.ok) {
        const body = await response.text();
        console.error(`[Cron] Scrape endpoint returned HTTP ${response.status}: ${body}`);
        return;
      }

      const result = await response.json();
      const { sourceResults, stats, trailers } = result;

      // Log a human-readable summary to Cloudflare Worker logs.
      for (const src of (sourceResults ?? [])) {
        if (src.success) {
          console.log(`[Cron] ${src.source}: SUCCESS — ${src.moviesFound} movie(s)`);
        } else {
          console.warn(`[Cron] ${src.source}: FAILED — ${src.error ?? "unknown error"}`);
        }
      }
      if (stats) {
        console.log(`[Cron] Movies — created: ${stats.created}, updated: ${stats.updated}, unchanged: ${stats.unchanged}`);
      }
      if (trailers) {
        console.log(`[Cron] Trailers — discovered: ${trailers.discovered}, skipped: ${trailers.skipped}, failed: ${trailers.failed}`);
      }
      console.log("[Cron] Sync complete.");

    } catch (e) {
      // Log but do not re-throw — a cron handler failure is silent otherwise.
      console.error("[Cron] Unexpected error during scheduled sync:", e);
    }
  },
};
