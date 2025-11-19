/**
 * Test script to verify image compression and thumbnail generation
 * 
 * Usage:
 *   npm run test:image <path-to-image-file>
 *   OR
 *   npx ts-node test-image-optimization.ts <path-to-image-file>
 * 
 * Example:
 *   npm run test:image ./test-image.jpg
 *   OR
 *   npx ts-node test-image-optimization.ts ./test-image.jpg
 */

import * as fs from 'fs';
import * as path from 'path';
import { compressImage, generateThumbnail, getImageMetadata } from '../src/utils/image-compression';

async function testImageOptimization(imagePath: string) {
  console.log('🧪 Testing Image Optimization\n');
  console.log('=' .repeat(50));
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Error: File not found: ${imagePath}`);
    process.exit(1);
  }

  // Read the original image
  const originalBuffer = fs.readFileSync(imagePath);
  const originalStats = fs.statSync(imagePath);
  const originalSize = originalStats.size;
  
  console.log(`📁 Original Image: ${path.basename(imagePath)}`);
  console.log(`   Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Get original metadata
  try {
    const originalMetadata = await getImageMetadata(originalBuffer);
    console.log(`   Dimensions: ${originalMetadata.width}x${originalMetadata.height}`);
    console.log(`   Format: ${originalMetadata.format}`);
  } catch (error) {
    console.warn(`   ⚠️  Could not read metadata: ${error}`);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  // Test compression
  console.log('\n🔄 Testing Compression...');
  try {
    const compressedBuffer = await compressImage(originalBuffer, 1920, 1920, 85);
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ Compression successful!`);
    console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Reduction: ${compressionRatio}%`);
    
    // Get compressed metadata
    const compressedMetadata = await getImageMetadata(compressedBuffer);
    console.log(`   New Dimensions: ${compressedMetadata.width}x${compressedMetadata.height}`);
    
    // Save compressed image for inspection
    const compressedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_compressed.jpg');
    fs.writeFileSync(compressedPath, compressedBuffer);
    console.log(`   💾 Saved to: ${path.basename(compressedPath)}`);
    
  } catch (error) {
    console.error(`❌ Compression failed: ${error}`);
    process.exit(1);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  // Test thumbnail generation
  console.log('\n🖼️  Testing Thumbnail Generation...');
  try {
    const thumbnailBuffer = await generateThumbnail(originalBuffer, 300, 75);
    const thumbnailSize = thumbnailBuffer.length;
    
    console.log(`✅ Thumbnail generation successful!`);
    console.log(`   Size: ${(thumbnailSize / 1024).toFixed(2)} KB`);
    console.log(`   Dimensions: 300x300 (cover fit)`);
    
    // Get thumbnail metadata
    const thumbnailMetadata = await getImageMetadata(thumbnailBuffer);
    console.log(`   Actual Dimensions: ${thumbnailMetadata.width}x${thumbnailMetadata.height}`);
    
    // Save thumbnail for inspection
    const thumbnailPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_thumbnail.jpg');
    fs.writeFileSync(thumbnailPath, thumbnailBuffer);
    console.log(`   💾 Saved to: ${path.basename(thumbnailPath)}`);
    
  } catch (error) {
    console.error(`❌ Thumbnail generation failed: ${error}`);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests passed!');
  console.log('\n📝 Summary:');
  console.log(`   • Original image: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   • Compressed image saved: ${imagePath.replace(/\.(jpg|jpeg|png)$/i, '_compressed.jpg')}`);
  console.log(`   • Thumbnail saved: ${imagePath.replace(/\.(jpg|jpeg|png)$/i, '_thumbnail.jpg')}`);
  console.log('\n💡 You can now inspect the generated files to verify quality.');
}

// Get image path from command line arguments
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('❌ Error: Please provide an image file path');
  console.log('\nUsage:');
  console.log('  npm run test:image <path-to-image-file>');
  console.log('  OR');
  console.log('  npx ts-node test-image-optimization.ts <path-to-image-file>');
  console.log('\nExample:');
  console.log('  npm run test:image ./test-image.jpg');
  console.log('  OR');
  console.log('  npx ts-node test-image-optimization.ts ./test-image.jpg');
  process.exit(1);
}

// Run the test
testImageOptimization(imagePath).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

