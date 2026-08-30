-- migrations/0003_scraped_name.sql
--
-- Adds scraped_name to movies so the original scraped title is preserved
-- separately from the admin-editable display name.
--
-- scraped_name: the raw title string last seen from the scraper (read-only from admin UI)
-- name:         the admin-editable display title (defaults to scraped_name on first insert)
--
-- This allows an admin to rename a movie for display without losing track of
-- what the scraper originally found (useful for debugging cross-source mismatches).

ALTER TABLE movies ADD COLUMN scraped_name TEXT;
