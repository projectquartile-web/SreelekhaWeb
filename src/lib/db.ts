import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

export interface Movie {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Show {
  id: number;
  movie_id: number;
  show_date: string;
  show_time: string;
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

export async function upsertShows(movieId: number, date: string, times: string[]): Promise<void> {
  const db = getDb();
  await db.prepare("PRAGMA foreign_keys = ON;").run();

  // Delete all existing shows for this movie and date
  await db.prepare(
    "DELETE FROM shows WHERE movie_id = ? AND show_date = ?"
  ).bind(movieId, date).run();

  // Insert the new times
  if (times.length > 0) {
    const stmts = times.map(time => 
      db.prepare(
        "INSERT INTO shows (movie_id, show_date, show_time) VALUES (?, ?, ?)"
      ).bind(movieId, date, time)
    );
    await db.batch(stmts);
  }
}
