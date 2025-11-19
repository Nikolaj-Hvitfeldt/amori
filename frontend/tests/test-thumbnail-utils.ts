/**
 * Test script to verify thumbnail URL utility functions
 * 
 * This can be run in Node.js or browser console to test the thumbnail URL conversion
 */

// Copy of the utility functions for testing
function getThumbnailUrl(fullUrl: string): string {
  if (!fullUrl) return fullUrl;
  
  // Check if URL already contains _thumb (already a thumbnail)
  if (fullUrl.includes('_thumb.')) {
    return fullUrl;
  }
  
  // Replace filename with thumbnail version
  // Pattern: .../filename.jpg -> .../filename_thumb.jpg
  try {
    const url = new URL(fullUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Only process if filename has extension
    if (filename.includes('.')) {
      const [name, ext] = filename.split('.');
      const thumbnailFilename = `${name}_thumb.${ext}`;
      pathParts[pathParts.length - 1] = thumbnailFilename;
      url.pathname = pathParts.join('/');
      return url.toString();
    }
  } catch (error) {
    // If URL parsing fails, return original (fallback to full image)
    console.warn('Failed to parse URL for thumbnail, using full image:', error);
  }
  
  // Fallback: return full URL if thumbnail conversion fails
  return fullUrl;
}

function isThumbnail(url: string): boolean {
  return url.includes('_thumb.');
}

function getFullSizeUrl(thumbnailUrl: string): string {
  if (!thumbnailUrl) return thumbnailUrl;
  
  if (!isThumbnail(thumbnailUrl)) {
    return thumbnailUrl; // Already full-size
  }
  
  // Remove _thumb from filename
  try {
    const url = new URL(thumbnailUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (filename.includes('_thumb.')) {
      const fullFilename = filename.replace('_thumb.', '.');
      pathParts[pathParts.length - 1] = fullFilename;
      url.pathname = pathParts.join('/');
      return url.toString();
    }
  } catch (error) {
    console.warn('Failed to parse thumbnail URL:', error);
  }
  
  return thumbnailUrl;
}

// Test cases
console.log('🧪 Testing Thumbnail URL Utilities\n');
console.log('='.repeat(50));

const testCases = [
  {
    name: 'Supabase Storage URL',
    fullUrl: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123.jpg',
    expectedThumbnail: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123_thumb.jpg'
  },
  {
    name: 'Already a thumbnail',
    fullUrl: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123_thumb.jpg',
    expectedThumbnail: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123_thumb.jpg'
  },
  {
    name: 'URL with query parameters',
    fullUrl: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123.jpg?t=1234567890',
    expectedThumbnail: 'https://your-project.supabase.co/storage/v1/object/public/date-photos/1234567890-abc123_thumb.jpg?t=1234567890'
  }
];

// Test getThumbnailUrl
console.log('\n📝 Testing getThumbnailUrl():\n');
testCases.forEach((testCase, index) => {
  const result = getThumbnailUrl(testCase.fullUrl);
  const passed = result === testCase.expectedThumbnail;
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`   Input:    ${testCase.fullUrl}`);
  console.log(`   Expected: ${testCase.expectedThumbnail}`);
  console.log(`   Got:      ${result}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Test isThumbnail
console.log('\n📝 Testing isThumbnail():\n');
const thumbnailTests = [
  { url: 'https://example.com/image_thumb.jpg', expected: true },
  { url: 'https://example.com/image.jpg', expected: false },
  { url: 'https://example.com/image_thumb.jpg?t=123', expected: true }
];

thumbnailTests.forEach((test, index) => {
  const result = isThumbnail(test.url);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}:`);
  console.log(`   URL: ${test.url}`);
  console.log(`   Expected: ${test.expected}, Got: ${result}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Test getFullSizeUrl
console.log('\n📝 Testing getFullSizeUrl():\n');
const fullSizeTests = [
  {
    thumbnailUrl: 'https://example.com/image_thumb.jpg',
    expected: 'https://example.com/image.jpg'
  },
  {
    thumbnailUrl: 'https://example.com/image.jpg',
    expected: 'https://example.com/image.jpg'
  }
];

fullSizeTests.forEach((test, index) => {
  const result = getFullSizeUrl(test.thumbnailUrl);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}:`);
  console.log(`   Input:    ${test.thumbnailUrl}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got:      ${result}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('='.repeat(50));
console.log('\n✅ Thumbnail URL utility tests complete!');

