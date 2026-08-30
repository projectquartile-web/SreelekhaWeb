-- migrations/0002_add_scraper_fields.sql

ALTER TABLE movies ADD COLUMN normalized_title TEXT;
ALTER TABLE movies ADD COLUMN source TEXT;
ALTER TABLE movies ADD COLUMN source_url TEXT;
ALTER TABLE movies ADD COLUMN last_seen_at TEXT;
ALTER TABLE movies ADD COLUMN poster_url TEXT;
ALTER TABLE movies ADD COLUMN youtube_trailer_id TEXT;
ALTER TABLE movies ADD COLUMN is_manual_override INTEGER DEFAULT 0;

CREATE INDEX idx_movies_normalized_title ON movies(normalized_title);
