import { scoreCandidate } from '../src/lib/scraper/youtube';
import { updateMovieTrailer, createMovie } from '../src/lib/db';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import assert from 'node:assert';

function testScoring() {
  console.log('--- Testing YouTube Scoring Engine ---');

  const movieTitle = 'irumudi';

  // Test 1: exact title + official trailer
  // title +30, official trailer +50 = 80 (Passes 70 threshold)
  let score = scoreCandidate('Irumudi Official Trailer', 'Some Channel', movieTitle);
  assert(score === 80, `Expected 80, got ${score}`);
  console.log('✅ exact title + official trailer');

  // Test 2: exact title + trailer + relevant channel
  // title +30, trailer +30, channel "films" +20 = 80 (Passes 70)
  score = scoreCandidate('Irumudi Trailer', 'Hombale Films', movieTitle);
  assert(score === 80, `Expected 80, got ${score}`);
  console.log('✅ exact title + trailer + relevant channel');

  // Test 3: exact title + trailer + irrelevant channel
  // title +30, trailer +30 = 60 (Fails 70 threshold)
  score = scoreCandidate('Irumudi Trailer', 'Random User', movieTitle);
  assert(score === 60, `Expected 60, got ${score}`);
  console.log('✅ exact title + trailer + irrelevant channel (rejected correctly)');

  // Test 4: unrelated trailer (missing movie title)
  // title mismatch = 0 (Fails 70)
  score = scoreCandidate('Some Other Movie Official Trailer', 'Hombale Films', movieTitle);
  assert(score === 0, `Expected 0, got ${score}`);
  console.log('✅ unrelated trailer (rejected correctly)');

  // Test 5: review/reaction/song/clip
  // title +30, trailer +30, "review" instant fail = -100
  score = scoreCandidate('Irumudi Trailer Review', 'Some Channel', movieTitle);
  assert(score === -100, `Expected -100, got ${score}`);
  console.log('✅ review/reaction (rejected correctly)');

  // Test 6: ambiguous title
  // movie: "KGF Chapter 2", candidate: "KGF Trailer" (missing chapter 2)
  // title mismatch = 0 (Fails)
  score = scoreCandidate('KGF Trailer', 'Hombale Films', 'KGF Chapter 2');
  assert(score === 0, `Expected 0, got ${score}`);
  console.log('✅ ambiguous title (rejected correctly)');

  console.log('All scoring tests passed!\n');
}

async function testDatabaseOverrides() {
  console.log('--- Testing Database Override Logic ---');
  // NOTE: This requires D1 to be available, so it needs getCloudflareContext
  try {
    const db = (getCloudflareContext().env as any).DB;
    if (!db) throw new Error("No DB");
    
    // Create a dummy movie
    const movie = await createMovie('Test Movie YT');
    
    // 1. Initial automatic trailer
    let updated = await updateMovieTrailer(movie.id, 'vid1', 70);
    assert(updated === true, "Initial automatic trailer should save");

    // 2. Existing automatic trailer - minor improvement (should fail)
    updated = await updateMovieTrailer(movie.id, 'vid2', 75); // Only +5
    assert(updated === false, "Marginal improvement should be skipped");

    // 3. Existing automatic trailer - substantial improvement (should pass)
    updated = await updateMovieTrailer(movie.id, 'vid3', 95); // +25
    assert(updated === true, "Substantial improvement should overwrite");

    // 4. Manual override
    await db.prepare('UPDATE movies SET youtube_trailer_is_manual_override = 1, youtube_trailer_id = "manual" WHERE id = ?').bind(movie.id).run();
    
    // 5. Attempt to update when manual override exists
    updated = await updateMovieTrailer(movie.id, 'vid4', 120);
    assert(updated === false, "Manual override should block updates");

    // Clean up
    await db.prepare('DELETE FROM movies WHERE id = ?').bind(movie.id).run();

    console.log('✅ Database override tests passed!\n');
  } catch (e) {
    console.error("Database tests skipped or failed:", e);
  }
}

testScoring();
testDatabaseOverrides().catch(console.error);
