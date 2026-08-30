-- migrations/0004_shows_manual_override.sql
--
-- Adds is_manual_override to shows table.
-- 0 (or NULL): automatically scraped showtime
-- 1: manually added or edited by admin
--
-- Manually overridden showtimes are protected from being deleted by the scraper.
-- When the admin saves shows for a day, all saved shows become manual overrides.

ALTER TABLE shows ADD COLUMN is_manual_override INTEGER DEFAULT 0;
