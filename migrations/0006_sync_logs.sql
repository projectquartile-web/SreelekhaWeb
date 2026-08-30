-- Migration number: 0006 	 2026-08-25T11:45:00.000Z

CREATE TABLE IF NOT EXISTS sync_logs (
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

-- Index to quickly get the most recent log
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs (created_at DESC);
