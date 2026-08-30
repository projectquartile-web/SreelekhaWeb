import * as cheerio from 'cheerio';

async function testYouTubeSearch(query: string) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  console.log(`Fetching: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return;
    }

    const html = await response.text();
    
    // Extract ytInitialData
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match) {
      console.error('ytInitialData not found in HTML');
      return;
    }

    try {
      const data = JSON.parse(match[1]);
      
      // Navigate the complex JSON structure to find video results
      // Typically: contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (!contents) {
        console.error('Unexpected JSON structure');
        return;
      }

      let items: any[] = [];
      for (const section of contents) {
        if (section.itemSectionRenderer?.contents) {
          items = items.concat(section.itemSectionRenderer.contents);
        }
      }

      const videos = items
        .map(item => item.videoRenderer)
        .filter(Boolean)
        .map(video => ({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text,
          channel: video.ownerText?.runs?.[0]?.text,
          publishedTimeText: video.publishedTimeText?.simpleText,
          viewCountText: video.viewCountText?.simpleText
        }));

      console.log(`Found ${videos.length} videos.`);
      if (videos.length > 0) {
        console.log('Top 3 results:');
        console.log(videos.slice(0, 3));
      }

    } catch (e) {
      console.error('Failed to parse ytInitialData JSON', e);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testYouTubeSearch('KGF Chapter 2 official trailer');
