/**
 * Test script to verify image compression and thumbnail generation
 * for images already in the database
 * 
 * Usage:
 *   npm run test:db-images
 *   OR
 *   npx ts-node test-db-image-optimization.ts
 */

// Load environment variables from .env file
import * as fs from 'fs';
import * as path from 'path';

// Simple .env loader (since we can't use dotenv without installing it)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as http from 'http';
import { compressImage, generateThumbnail, getImageMetadata } from '../src/utils/image-compression';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'your-service-role-key';

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-service-role-key') {
  console.error('❌ Error: Supabase credentials not configured!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Check if thumbnail exists in storage
 */
async function checkThumbnailExists(imageUrl: string): Promise<{ exists: boolean; thumbnailUrl: string }> {
  try {
    // Extract bucket and path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the storage path (usually after /storage/v1/object/public/)
    const storageIndex = pathParts.findIndex(part => part === 'storage');
    if (storageIndex === -1) {
      return { exists: false, thumbnailUrl: '' };
    }

    // Extract bucket name and file path
    const bucketIndex = pathParts.findIndex(part => part === 'public');
    if (bucketIndex === -1) {
      return { exists: false, thumbnailUrl: '' };
    }

    const bucketName = pathParts[bucketIndex + 1];
    const filePath = pathParts.slice(bucketIndex + 2).join('/');
    
    // Generate thumbnail path
    const pathParts2 = filePath.split('/');
    const filename = pathParts2[pathParts2.length - 1];
    const [name, ext] = filename.split('.');
    const thumbnailFilename = `${name}_thumb.${ext}`;
    pathParts2[pathParts2.length - 1] = thumbnailFilename;
    const thumbnailPath = pathParts2.join('/');

    // Check if thumbnail exists
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(pathParts2.slice(0, -1).join('/'), {
        search: thumbnailFilename
      });

    const thumbnailUrl = imageUrl.replace(filename, thumbnailFilename);
    
    return {
      exists: !error && data && data.length > 0,
      thumbnailUrl
    };
  } catch (error) {
    console.warn('Error checking thumbnail:', error);
    return { exists: false, thumbnailUrl: '' };
  }
}

/**
 * Test images from database
 */
async function testDatabaseImages() {
  console.log('🧪 Testing Image Optimization in Database\n');
  console.log('='.repeat(50));

  // Test images from different tables
  const tables = [
    { name: 'date_entries', column: 'photos', bucket: 'date-photos' },
    { name: 'moments', column: 'photos', bucket: 'moments-photos' },
    { name: 'milestones', column: 'photos', bucket: 'milestone-photos' }
  ];

  let totalImages = 0;
  let imagesWithThumbnails = 0;
  let imagesWithoutThumbnails = 0;
  let errors = 0;

  for (const table of tables) {
    console.log(`\n📊 Checking ${table.name}...`);
    
    try {
      // Fetch entries with photos
      const { data: entries, error } = await supabase
        .from(table.name)
        .select(`id, ${table.column}`)
        .not(table.column, 'is', null);

      if (error) {
        console.error(`  ❌ Error fetching ${table.name}:`, error.message);
        continue;
      }

      if (!entries || entries.length === 0) {
        console.log(`  ℹ️  No entries with photos found in ${table.name}`);
        continue;
      }

      console.log(`  Found ${entries.length} entries with photos`);

      // Process each entry
      for (const entry of entries) {
        const photos = entry[table.column] as string[];
        if (!photos || photos.length === 0) continue;

        for (const photoUrl of photos) {
          if (!photoUrl || typeof photoUrl !== 'string') continue;
          
          // Skip if already a thumbnail
          if (photoUrl.includes('_thumb.')) continue;

          totalImages++;
          
          try {
            // Check if thumbnail exists
            const { exists, thumbnailUrl } = await checkThumbnailExists(photoUrl);
            
            if (exists) {
              imagesWithThumbnails++;
              console.log(`  ✅ Thumbnail exists: ${photoUrl.split('/').pop()}`);
              
              // Download and verify thumbnail size
              try {
                const thumbnailBuffer = await downloadImage(thumbnailUrl);
                const thumbnailMetadata = await getImageMetadata(thumbnailBuffer);
                console.log(`     Thumbnail size: ${(thumbnailBuffer.length / 1024).toFixed(2)} KB, ${thumbnailMetadata.width}x${thumbnailMetadata.height}`);
              } catch (err) {
                console.warn(`     ⚠️  Could not verify thumbnail: ${err}`);
              }
            } else {
              imagesWithoutThumbnails++;
              console.log(`  ⚠️  No thumbnail found: ${photoUrl.split('/').pop()}`);
            }

            // Download and check full image
            try {
              const imageBuffer = await downloadImage(photoUrl);
              const imageMetadata = await getImageMetadata(imageBuffer);
              const fileSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
              console.log(`     Full image size: ${fileSizeMB} MB, ${imageMetadata.width}x${imageMetadata.height}`);
              
              // Check if image is already compressed (should be <= 1920x1920)
              if (imageMetadata.width && imageMetadata.height) {
                if (imageMetadata.width > 1920 || imageMetadata.height > 1920) {
                  console.log(`     ⚠️  Image not compressed (larger than 1920x1920)`);
                } else {
                  console.log(`     ✅ Image is compressed (${imageMetadata.width}x${imageMetadata.height})`);
                }
              }
              
              // Also check file size as indicator (compressed images should be smaller)
              if (imageBuffer.length > 2 * 1024 * 1024) { // > 2MB
                console.log(`     ⚠️  File size suggests image may not be compressed (${fileSizeMB} MB)`);
              } else if (imageMetadata.width && imageMetadata.height && 
                         imageMetadata.width <= 1920 && imageMetadata.height <= 1920) {
                console.log(`     ✅ File size and dimensions confirm compression`);
              }
            } catch (err) {
              console.warn(`     ⚠️  Could not download full image: ${err}`);
            }
          } catch (err) {
            errors++;
            console.error(`  ❌ Error processing image ${photoUrl}:`, err);
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${table.name}:`, error);
      errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   Total images checked: ${totalImages}`);
  console.log(`   Images with thumbnails: ${imagesWithThumbnails} ✅`);
  console.log(`   Images without thumbnails: ${imagesWithoutThumbnails} ⚠️`);
  console.log(`   Errors: ${errors} ❌`);

  if (imagesWithoutThumbnails > 0) {
    console.log('\n💡 Note: Some images don\'t have thumbnails.');
    console.log('   This might be because:');
    console.log('   - They were uploaded before thumbnail generation was implemented');
    console.log('   - Thumbnail generation failed during upload');
    console.log('   - The images are in a different storage location');
  }

  if (totalImages === 0) {
    console.log('\n💡 No images found in database. Try uploading an image through the app first.');
  }
}

// Run the test
testDatabaseImages().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

