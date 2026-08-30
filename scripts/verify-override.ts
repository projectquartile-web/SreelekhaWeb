import { getShowsForDate, upsertShows, getMovies } from '../src/lib/db';
import { runScraper } from '../src/lib/scraper';

async function test() {
  const movies = await getMovies();
  if (movies.length === 0) {
    console.error("No movies found. Please run the scraper first to populate D1.");
    process.exit(1);
  }
  const movie = movies[0]; // Take the first movie (e.g. Irumudi)
  
  // Use today's date
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  let date = '';
  for (const p of parts) {
    if (p.type === 'year' || p.type === 'month' || p.type === 'day') date += p.value + (p.type === 'day' ? '' : '-');
  }

  console.log(`Testing with movie: ${movie.name} on ${date}`);

  // 1. Admin manually adds showtimes (including a special one to track)
  console.log("\n--- Admin saving manual showtimes ---");
  const manualTimes = ["10:00", "13:30", "22:55"]; // 22:55 is our special manual one
  await upsertShows(movie.id, date, manualTimes, true);
  
  let shows = await getShowsForDate(movie.id, date);
  console.log("Shows after admin save:", shows.map(s => ({ time: s.show_time, manual: s.is_manual_override })));

  // 2. Run the scraper
  console.log("\n--- Running Scraper ---");
  await runScraper();

  // 3. Verify shows
  shows = await getShowsForDate(movie.id, date);
  console.log("\nShows after scraper run:");
  shows.forEach(s => {
    console.log(`- ${s.show_time} (manual: ${s.is_manual_override})`);
  });

  const hasManual = shows.some(s => s.show_time === "22:55" && s.is_manual_override === 1);
  const hasScraped = shows.some(s => s.show_time !== "22:55" && s.is_manual_override === 0);

  if (hasManual) {
    console.log("✅ SUCCESS: Manual showtime (22:55) survived the scrape!");
  } else {
    console.log("❌ FAILURE: Manual showtime was deleted.");
  }

  if (hasScraped) {
    console.log("✅ SUCCESS: Scraper successfully added new scraped showtimes.");
  } else {
    console.log("⚠️  Note: No new scraped showtimes were added. (Maybe the scraper timed out or didn't find any?).");
  }
}

test().catch(console.error);
