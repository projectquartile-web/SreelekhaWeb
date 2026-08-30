import Database from "better-sqlite3";
import fs from "fs";

const db = new Database(":memory:");

// 1. Simulate exact production schema
db.exec(`
CREATE TABLE movies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE shows (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  show_date  TEXT    NOT NULL,
  show_time  TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(movie_id, show_date, show_time)
);

CREATE INDEX idx_shows_date ON shows(show_date);

CREATE TABLE sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  shmoti_status TEXT NOT NULL,
  bms_status TEXT NOT NULL,
  youtube_status TEXT NOT NULL,
  movies_created INTEGER NOT NULL,
  movies_updated INTEGER NOT NULL,
  movies_unchanged INTEGER NOT NULL,
  shows_added INTEGER NOT NULL,
  shows_updated INTEGER NOT NULL,
  shows_removed INTEGER NOT NULL,
  trailers_discovered INTEGER NOT NULL,
  trailers_skipped INTEGER NOT NULL,
  trailers_failed INTEGER NOT NULL
);

CREATE INDEX idx_sync_logs_created_at ON sync_logs (created_at DESC);
`);

// 2. Insert some dummy data
db.exec(`
INSERT INTO movies (name) VALUES ('Test Movie 1');
INSERT INTO movies (name) VALUES ('Test Movie 2');
INSERT INTO shows (movie_id, show_date, show_time) VALUES (1, '2026-08-25', '10:00');
`);

console.log("Initial state created. Movies:");
console.log(db.prepare("SELECT * FROM movies").all());

// 3. Apply missing migrations: 0002, 0003, 0004, 0005
const migrations = [
  "migrations/0002_add_scraper_fields.sql",
  "migrations/0003_scraped_name.sql",
  "migrations/0004_shows_manual_override.sql",
  "migrations/0005_youtube_trailer_override.sql",
];

for (const mig of migrations) {
  console.log(`Applying ${mig}...`);
  const sql = fs.readFileSync(mig, "utf8");
  db.exec(sql);
}

console.log("Migrations applied. Movies:");
console.log(db.prepare("SELECT * FROM movies").all());
console.log("Shows:");
console.log(db.prepare("SELECT * FROM shows").all());

console.log("SUCCESS!");
