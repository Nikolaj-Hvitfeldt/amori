/**
 * Script to fix orphaned date-photos in storage
 * Compresses and generates thumbnails for files that aren't in the database
 * 
 * Usage:
 *   npm run fix:date-photos
 *   OR
 *   npx ts-node scripts/fix-date-photos.ts
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
import { compressImage, generateThumbnail, getImageMetadata } from '../src/utils/image-compression';

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
 * Fix orphaned date-photos
 */
async function fixDatePhotos() {
  console.log('🔧 Fixing Orphaned Date Photos\n');
  console.log('='.repeat(50));

  const bucketName = 'date-photos';
  
  try {
    // List all files in date-photos bucket
    // Try listing from the bucket name as a path (files might be in subdirectory)
    let files: any[] = [];
    let listError: any = null;
    
    // Try root first
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000
      });
    
    if (rootError) {
      listError = rootError;
    } else {
      files = rootFiles || [];
    }
    
    // If we got folders or the bucket name itself, try listing from that path
    if (files.length > 0 && files.some(f => f.name === bucketName || !f.name.includes('.'))) {
      const { data: subFiles } = await supabase.storage
        .from(bucketName)
        .list(bucketName, {
          limit: 1000
        });
      if (subFiles && subFiles.length > 0) {
        files = subFiles;
      }
    }

    if (listError) {
      console.error(`❌ Error listing files: ${listError.message}`);
      return;
    }

    if (!files || files.length === 0) {
      console.log('ℹ️  No files found in date-photos bucket');
      return;
    }

      // Filter out thumbnails, folders, and get only actual image files
      // Files have metadata.size, folders don't
      const fullImages = files.filter(f => {
        const isImage = f.name.endsWith('.jpg') || f.name.endsWith('.jpeg') || f.name.endsWith('.png');
        const isNotThumbnail = !f.name.includes('_thumb.');
        const isNotFolder = f.name !== bucketName && f.metadata?.size !== undefined;
        return isImage && isNotThumbnail && isNotFolder;
      });
    
    console.log(`Found ${fullImages.length} full images to process\n`);

    let processed = 0;
    let compressed = 0;
    let thumbnailsCreated = 0;
    let errors = 0;
    let totalSizeSaved = 0;

    for (const file of fullImages) {
      try {
        const fileName = file.name;
        const filePath = `${bucketName}/${fileName}`;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        console.log(`\n📄 Processing: ${fileName}`);
        
        // Download image
        console.log(`  📥 Downloading...`);
        const originalBuffer = await downloadImage(publicUrl);
        const originalSize = originalBuffer.length;
        const originalMetadata = await getImageMetadata(originalBuffer);
        
        console.log(`     Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB, ${originalMetadata.width}x${originalMetadata.height}`);

        // Check if already compressed
        if (originalMetadata.width && originalMetadata.height) {
          if (originalMetadata.width <= 1920 && originalMetadata.height <= 1920 && originalSize < 2 * 1024 * 1024) {
            console.log(`     ✅ Already compressed, skipping compression`);
          } else {
            // Compress image
            console.log(`  🗜️  Compressing...`);
            const compressedBuffer = await compressImage(originalBuffer, 1920, 1920, 85);
            const compressedSize = compressedBuffer.length;
            const compressedMetadata = await getImageMetadata(compressedBuffer);
            const sizeReduction = originalSize - compressedSize;
            
            console.log(`     Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB, ${compressedMetadata.width}x${compressedMetadata.height}`);
            console.log(`     Saved: ${(sizeReduction / 1024 / 1024).toFixed(2)} MB (${((sizeReduction / originalSize) * 100).toFixed(1)}%)`);

            // Upload compressed version
            console.log(`  📤 Uploading compressed image...`);
            const { error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(fileName, compressedBuffer, {
                contentType: 'image/jpeg',
                upsert: true // Replace existing
              });

            if (uploadError) {
              console.error(`     ❌ Upload failed: ${uploadError.message}`);
              errors++;
              continue;
            }

            console.log(`     ✅ Image compressed and replaced`);
            compressed++;
            totalSizeSaved += sizeReduction;
          }
        }

        // Check if thumbnail exists
        const thumbnailName = fileName.replace(/\.(jpg|jpeg|png)$/i, '_thumb.$1');
        const { data: thumbFiles } = await supabase.storage
          .from(bucketName)
          .list('', {
            search: thumbnailName
          });

        if (thumbFiles && thumbFiles.length > 0) {
          console.log(`  ✅ Thumbnail already exists`);
        } else {
          // Generate thumbnail from compressed image (or original if not compressed)
          console.log(`  🖼️  Generating thumbnail...`);
          const imageForThumb = originalMetadata.width && originalMetadata.width <= 1920 
            ? originalBuffer 
            : await downloadImage(publicUrl); // Re-download if we compressed
          
          const thumbnailBuffer = await generateThumbnail(imageForThumb, 300, 75);
          const thumbnailSize = thumbnailBuffer.length;
          
          console.log(`     Thumbnail size: ${(thumbnailSize / 1024).toFixed(2)} KB`);

          // Upload thumbnail
          console.log(`  📤 Uploading thumbnail...`);
          const { error: thumbError } = await supabase.storage
            .from(bucketName)
            .upload(thumbnailName, thumbnailBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (thumbError) {
            console.error(`     ❌ Thumbnail upload failed: ${thumbError.message}`);
          } else {
            console.log(`     ✅ Thumbnail created: ${thumbnailName}`);
            thumbnailsCreated++;
          }
        }

        processed++;

      } catch (err) {
        errors++;
        console.error(`  ❌ Error processing ${file.name}: ${err}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   Files processed: ${processed}`);
    console.log(`   Images compressed: ${compressed} ✅`);
    console.log(`   Thumbnails created: ${thumbnailsCreated} ✅`);
    console.log(`   Errors: ${errors} ❌`);
    console.log(`   Total size saved: ${(totalSizeSaved / 1024 / 1024).toFixed(2)} MB`);

    if (processed > 0) {
      console.log('\n✅ Date photos fixed!');
      console.log('   All images are now compressed and have thumbnails.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatePhotos();

