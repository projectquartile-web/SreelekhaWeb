-- migrations/0001_initial.sql

CREATE TABLE movies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL CHECK(length(trim(name)) > 0),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE shows (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  show_date  TEXT    NOT NULL,  -- YYYY-MM-DD (Asia/Kolkata)
  show_time  TEXT    NOT NULL,  -- HH:MM (24-hour)
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(movie_id, show_date, show_time)
);

CREATE INDEX idx_shows_date ON shows(show_date);
