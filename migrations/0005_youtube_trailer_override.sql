-- migrations/0005_youtube_trailer_override.sql
--
-- Adds youtube_trailer_is_manual_override to movies table.
-- 0 (or NULL): automatically discovered trailer
-- 1: manually added or edited by admin
--
-- Also adds youtube_trailer_score to track the confidence score of the currently stored automatic trailer.
-- This allows the scraper to only replace an automatic trailer if it finds a substantially better one (+20 points).

ALTER TABLE movies ADD COLUMN youtube_trailer_is_manual_override INTEGER DEFAULT 0;
ALTER TABLE movies ADD COLUMN youtube_trailer_score INTEGER DEFAULT 0;
