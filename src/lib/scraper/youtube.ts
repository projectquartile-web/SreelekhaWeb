/**
 * YouTube Trailer Auto-Discovery Module
 * Extracts candidate videos from ytInitialData without relying on official APIs.
 */

export interface YouTubeTrailerCandidate {
  videoId: string;
  title: string;
  channel: string;
  score: number;
}

export interface YouTubeDiscoveryResult {
  trailerId: string | null;
  score: number;
  reason: 'discovered' | 'rejected_low_confidence' | 'failed';
}

/**
 * Normalizes strings for comparison (lowercases and removes non-alphanumeric chars)
 */
function normalizeForComparison(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Scores a candidate video.
 *
 * Rules:
 * A candidate must contain a meaningful match to the normalized movie title AND contain trailer, official trailer, teaser, etc.
 * Channel relevance alone must never compensate for a missing movie-title match.
 *
 * Title Matching:
 * +30 exact normalized title match
 * +50 "official trailer"
 * +30 "trailer" (if not official)
 * +20 "teaser"
 *
 * Channel Relevance:
 * +20 for official sounding channels ("films", "studios", "entertainment", "music", "movies", "cinemas")
 * -20 for unofficial sounding channels ("fan", "reaction", "review")
 *
 * Disqualification (-100):
 * "review", "reaction", "spoof", "bgm", "song", "lyric", "lyrical", "short", "clip", "full movie", "status", "public talk", "roast"
 */
export function scoreCandidate(
  candidateTitle: string,
  candidateChannel: string,
  normalizedMovieTitle: string
): number {
  let score = 0;
  const lowerTitle = (candidateTitle || '').toLowerCase();
  const lowerChannel = (candidateChannel || '').toLowerCase();
  const lowerMovieTitle = (normalizedMovieTitle || '').toLowerCase();

  // Disqualifications
  const disqualifiers = [
    'review', 'reaction', 'spoof', 'bgm', 'song', 'lyric', 'lyrical',
    'short', 'clip', 'full movie', 'status', 'public talk', 'roast'
  ];
  for (const dq of disqualifiers) {
    if (lowerTitle.includes(dq)) {
      return -100;
    }
  }

  // Movie Title Match (Must be a meaningful match)
  const normalizedCandidateTitle = normalizeForComparison(lowerTitle);
  const normalizedMovieSearch = normalizeForComparison(lowerMovieTitle);
  
  if (normalizedCandidateTitle.includes(normalizedMovieSearch)) {
    score += 30;
  } else {
    // If the movie title doesn't match at all, disqualify the candidate immediately.
    // Channel relevance alone must never compensate for a missing movie-title match.
    return 0;
  }

  // Trailer Keywords
  if (lowerTitle.includes('official trailer')) {
    score += 50;
  } else if (lowerTitle.includes('trailer')) {
    score += 30;
  } else if (lowerTitle.includes('teaser')) {
    score += 20;
  }

  // Channel Relevance
  const officialChannels = ['films', 'studios', 'entertainment', 'music', 'movies', 'cinemas', 'official'];
  const unofficialChannels = ['fan', 'reaction', 'review'];

  for (const oc of officialChannels) {
    if (lowerChannel.includes(oc)) {
      score += 20;
      break;
    }
  }

  for (const uc of unofficialChannels) {
    if (lowerChannel.includes(uc)) {
      score -= 20;
      break;
    }
  }

  return score;
}

/**
 * Discovers the best trailer for a movie by searching YouTube.
 * Returns a result object containing the trailerId (if successful) and the reason.
 */
export async function discoverTrailer(normalizedMovieTitle: string): Promise<YouTubeDiscoveryResult> {
  const searchQuery = `${normalizedMovieTitle} official trailer`;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { trailerId: null, score: 0, reason: 'failed' };
    }

    const html = await response.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    
    if (!match) {
      return { trailerId: null, score: 0, reason: 'failed' };
    }

    const data = JSON.parse(match[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (!contents) {
      return { trailerId: null, score: 0, reason: 'failed' };
    }

    let items: any[] = [];
    for (const section of contents) {
      if (section.itemSectionRenderer?.contents) {
        items = items.concat(section.itemSectionRenderer.contents);
      }
    }

    const candidates: YouTubeTrailerCandidate[] = items
      .map(item => item.videoRenderer)
      .filter(Boolean)
      .map(video => ({
        videoId: video.videoId,
        title: video.title?.runs?.[0]?.text || '',
        channel: video.ownerText?.runs?.[0]?.text || '',
        score: scoreCandidate(
          video.title?.runs?.[0]?.text || '',
          video.ownerText?.runs?.[0]?.text || '',
          normalizedMovieTitle
        )
      }));

    if (candidates.length === 0) {
      return { trailerId: null, score: 0, reason: 'rejected_low_confidence' };
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const bestCandidate = candidates[0];

    // Confidence Threshold: 70
    if (bestCandidate.score >= 70) {
      return { trailerId: bestCandidate.videoId, score: bestCandidate.score, reason: 'discovered' };
    } else {
      return { trailerId: null, score: bestCandidate.score, reason: 'rejected_low_confidence' };
    }

  } catch (e) {
    clearTimeout(timeoutId);
    return { trailerId: null, score: 0, reason: 'failed' };
  }
}
