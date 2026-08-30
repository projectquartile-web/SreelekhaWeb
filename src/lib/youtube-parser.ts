/**
 * Validates and extracts a YouTube Video ID from various URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 *
 * Returns the 11-character video ID if valid, otherwise null.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    // Already a raw ID
    return trimmed;
  }

  // Regex handles: youtu.be, youtube.com/watch?v=, youtube.com/embed/, youtube.com/shorts/, youtube.com/v/
  // It captures the exactly 11-character ID in group 1
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})(?=["&?\/\s]|$)/i;
  const match = trimmed.match(regex);

  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  return null;
}
