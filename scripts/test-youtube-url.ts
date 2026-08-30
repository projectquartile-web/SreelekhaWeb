import { extractYouTubeId } from '../src/lib/youtube-parser';
import assert from 'node:assert';

function runTests() {
  console.log('--- Testing YouTube URL Parser ---');

  const expectedId = 'dQw4w9WgXcQ';

  const validUrls = [
    'dQw4w9WgXcQ', // raw ID
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=10',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ'
  ];

  for (const url of validUrls) {
    const id = extractYouTubeId(url);
    assert(id === expectedId, `Expected ${expectedId} for ${url}, but got ${id}`);
    console.log(`✅ ${url} -> ${id}`);
  }

  const invalidUrls = [
    '',
    'not_a_url',
    'https://google.com',
    'https://youtube.com',
    'https://www.youtube.com/watch?v=123', // Too short
    'https://www.youtube.com/watch?v=123456789012' // Too long
  ];

  for (const url of invalidUrls) {
    const id = extractYouTubeId(url);
    assert(id === null, `Expected null for ${url}, but got ${id}`);
    console.log(`✅ Invalid ${url} correctly rejected`);
  }

  console.log('All URL parser tests passed!\n');
}

runTests();
