/**
 * Script to compress existing images in the database
 * This will download images, compress them, and replace the originals in storage
 * 
 * Usage:
 *   npm run compress:images
 *   OR
 *   npx ts-node compress-existing-images.ts
 */

// Load environment variables from .env file
import * as fs from 'fs';
import * as path from 'path';

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
import { compressImage, getImageMetadata } from '../src/utils/image-compression';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'your-service-role-key';

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-service-role-key') {
  console.error('❌ Error: Supabase credentials not configured!');
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
 * Extract bucket and path from Supabase Storage URL
 */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const publicIndex = pathParts.findIndex(part => part === 'public');
    
    if (publicIndex === -1) return null;
    
    const bucket = pathParts[publicIndex + 1];
    const filePath = pathParts.slice(publicIndex + 2).join('/');
    
    return { bucket, path: filePath };
  } catch {
    return null;
  }
}

/**
 * Compress existing images
 */
async function compressExistingImages() {
  console.log('🗜️  Compressing Existing Images\n');
  console.log('='.repeat(50));

  const tables = [
    { name: 'date_entries', column: 'photos', bucket: 'date-photos' },
    { name: 'moments', column: 'photos', bucket: 'moments-photos' },
    { name: 'milestones', column: 'photos', bucket: 'milestone-photos' }
  ];

  let totalProcessed = 0;
  let imagesCompressed = 0;
  let imagesSkipped = 0;
  let errors = 0;
  let totalSizeSaved = 0;

  for (const table of tables) {
    console.log(`\n📊 Processing ${table.name}...`);
    
    try {
      const { data: entries, error } = await supabase
        .from(table.name)
        .select(`id, ${table.column}`)
        .not(table.column, 'is', null);

      if (error) {
        console.error(`  ❌ Error fetching ${table.name}:`, error.message);
        continue;
      }

      if (!entries || entries.length === 0) {
        console.log(`  ℹ️  No entries with photos found`);
        continue;
      }

      console.log(`  Found ${entries.length} entries with photos`);

      for (const entry of entries) {
        const photos = entry[table.column] as string[];
        if (!photos || photos.length === 0) continue;

        for (const photoUrl of photos) {
          if (!photoUrl || typeof photoUrl !== 'string') continue;
          
          // Skip if already a thumbnail
          if (photoUrl.includes('_thumb.')) continue;

          totalProcessed++;

          try {
            const parsed = parseStorageUrl(photoUrl);
            if (!parsed) {
              console.log(`  ⚠️  Could not parse URL: ${photoUrl.substring(0, 50)}...`);
              continue;
            }

            const { bucket, path: filePath } = parsed;
            const filename = filePath.split('/').pop() || '';

            // Download image
            console.log(`  📥 Downloading: ${filename}...`);
            const originalBuffer = await downloadImage(photoUrl);
            const originalSize = originalBuffer.length;
            const originalMetadata = await getImageMetadata(originalBuffer);
            
            console.log(`     Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB, ${originalMetadata.width}x${originalMetadata.height}`);

            // Check if already compressed (smaller than 1920x1920)
            if (originalMetadata.width && originalMetadata.height) {
              if (originalMetadata.width <= 1920 && originalMetadata.height <= 1920) {
                console.log(`     ✅ Already compressed (${originalMetadata.width}x${originalMetadata.height})`);
                imagesSkipped++;
                continue;
              }
            }

            // Compress image
            console.log(`  🗜️  Compressing...`);
            const compressedBuffer = await compressImage(originalBuffer, 1920, 1920, 85);
            const compressedSize = compressedBuffer.length;
            const compressedMetadata = await getImageMetadata(compressedBuffer);
            const sizeReduction = originalSize - compressedSize;
            const reductionPercent = ((sizeReduction / originalSize) * 100).toFixed(1);
            
            console.log(`     Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB, ${compressedMetadata.width}x${compressedMetadata.height}`);
            console.log(`     Saved: ${(sizeReduction / 1024 / 1024).toFixed(2)} MB (${reductionPercent}%)`);

            // Upload compressed version (replace original)
            console.log(`  📤 Uploading compressed image...`);
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, compressedBuffer, {
                contentType: 'image/jpeg',
                upsert: true // Replace existing file
              });

            if (uploadError) {
              console.error(`     ❌ Upload failed: ${uploadError.message}`);
              errors++;
              continue;
            }

            console.log(`     ✅ Image compressed and replaced`);
            imagesCompressed++;
            totalSizeSaved += sizeReduction;

          } catch (err) {
            errors++;
            console.error(`  ❌ Error processing image: ${err}`);
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
  console.log(`   Total images processed: ${totalProcessed}`);
  console.log(`   Images compressed: ${imagesCompressed} ✅`);
  console.log(`   Images skipped (already compressed): ${imagesSkipped}`);
  console.log(`   Errors: ${errors} ❌`);
  console.log(`   Total size saved: ${(totalSizeSaved / 1024 / 1024).toFixed(2)} MB`);

  if (imagesCompressed > 0) {
    console.log('\n✅ Image compression complete!');
    console.log('   Compressed images have replaced the originals in storage.');
    console.log('   Note: Thumbnails will need to be regenerated for compressed images.');
  }
}

// Run the compression
compressExistingImages().catch((error) => {
  console.error('❌ Compression failed:', error);
  process.exit(1);
});

