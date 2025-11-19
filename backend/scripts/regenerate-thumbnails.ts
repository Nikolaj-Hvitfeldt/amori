/**
 * Script to regenerate thumbnails for existing images in the database
 * This will download images, generate thumbnails, and upload them to storage
 * 
 * Usage:
 *   npm run regenerate:thumbnails
 *   OR
 *   npx ts-node regenerate-thumbnails.ts
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
import { generateThumbnail, getImageMetadata } from '../src/utils/image-compression';

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
 * Regenerate thumbnails for all images
 */
async function regenerateThumbnails() {
  console.log('🔄 Regenerating Thumbnails for Existing Images\n');
  console.log('='.repeat(50));

  const tables = [
    { name: 'date_entries', column: 'photos', bucket: 'date-photos' },
    { name: 'moments', column: 'photos', bucket: 'moments-photos' },
    { name: 'milestones', column: 'photos', bucket: 'milestone-photos' }
  ];

  let totalProcessed = 0;
  let thumbnailsCreated = 0;
  let thumbnailsSkipped = 0;
  let errors = 0;

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
            // Check if thumbnail already exists
            const parsed = parseStorageUrl(photoUrl);
            if (!parsed) {
              console.log(`  ⚠️  Could not parse URL: ${photoUrl.substring(0, 50)}...`);
              continue;
            }

            const { bucket, path: filePath } = parsed;
            const pathParts = filePath.split('/');
            const filename = pathParts[pathParts.length - 1];
            const [name, ext] = filename.split('.');
            const thumbnailFilename = `${name}_thumb.${ext}`;
            const thumbnailPath = [...pathParts.slice(0, -1), thumbnailFilename].join('/');

            // Check if thumbnail exists
            const { data: existing } = await supabase.storage
              .from(bucket)
              .list(pathParts.slice(0, -1).join('/'), {
                search: thumbnailFilename
              });

            if (existing && existing.length > 0) {
              console.log(`  ✅ Thumbnail already exists: ${filename}`);
              thumbnailsSkipped++;
              continue;
            }

            // Download image
            console.log(`  📥 Downloading: ${filename}...`);
            const imageBuffer = await downloadImage(photoUrl);
            const originalSize = imageBuffer.length;
            console.log(`     Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

            // Generate thumbnail
            console.log(`  🖼️  Generating thumbnail...`);
            const thumbnailBuffer = await generateThumbnail(imageBuffer, 300, 75);
            const thumbnailSize = thumbnailBuffer.length;
            console.log(`     Thumbnail size: ${(thumbnailSize / 1024).toFixed(2)} KB`);

            // Upload thumbnail
            console.log(`  📤 Uploading thumbnail...`);
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(thumbnailPath, thumbnailBuffer, {
                contentType: 'image/jpeg',
                upsert: true // Overwrite if exists
              });

            if (uploadError) {
              console.error(`     ❌ Upload failed: ${uploadError.message}`);
              errors++;
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(thumbnailPath);

            console.log(`     ✅ Thumbnail created: ${thumbnailFilename}`);
            console.log(`     📍 URL: ${publicUrl}`);
            thumbnailsCreated++;

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
  console.log(`   Thumbnails created: ${thumbnailsCreated} ✅`);
  console.log(`   Thumbnails skipped (already exist): ${thumbnailsSkipped}`);
  console.log(`   Errors: ${errors} ❌`);

  if (thumbnailsCreated > 0) {
    console.log('\n✅ Thumbnail regeneration complete!');
    console.log('   New thumbnails are now available in your storage.');
  }
}

// Run the regeneration
regenerateThumbnails().catch((error) => {
  console.error('❌ Regeneration failed:', error);
  process.exit(1);
});

