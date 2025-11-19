/**
 * Check what files are actually in the storage buckets
 */

// Load environment variables
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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageBuckets() {
  console.log('🔍 Checking Storage Buckets...\n');
  
  const buckets = ['date-photos', 'moments-photos', 'milestone-photos'];
  
  for (const bucketName of buckets) {
    console.log(`\n📦 Bucket: ${bucketName}`);
    console.log('='.repeat(50));
    
    try {
      // List files in the bucket (including subdirectories)
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(bucketName, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      // If that doesn't work, try root level
      let allFiles = files || [];
      if (allFiles.length === 0 || (allFiles.length === 1 && allFiles[0].name === bucketName)) {
        const { data: rootFiles } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 1000
          });
        allFiles = rootFiles || [];
      }
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        continue;
      }
      
      if (!allFiles || allFiles.length === 0) {
        console.log(`  ℹ️  No files found`);
        continue;
      }
      
      // Filter out folders (they usually don't have a size or have id property)
      const actualFiles = allFiles.filter(f => f.id || f.metadata?.size !== undefined);
      
      console.log(`  Found ${actualFiles.length} files (${allFiles.length} total items)\n`);
      
      // Separate thumbnails from full images
      const fullImages = actualFiles.filter(f => !f.name.includes('_thumb.'));
      const thumbnails = actualFiles.filter(f => f.name.includes('_thumb.'));
      
      console.log(`  Full images: ${fullImages.length}`);
      console.log(`  Thumbnails: ${thumbnails.length}\n`);
      
      // Show first few files with sizes
      fullImages.slice(0, 10).forEach((file, i) => {
        const sizeMB = file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) : 
                       (file as any).size ? ((file as any).size / 1024 / 1024).toFixed(2) : 'unknown';
        const hasThumbnail = thumbnails.some(t => {
          const thumbName = file.name.replace(/\.(jpg|jpeg|png)$/i, '_thumb.$1');
          return t.name === thumbName || t.name.includes(file.name.split('.')[0] + '_thumb');
        });
        console.log(`  ${i + 1}. ${file.name}`);
        console.log(`     Size: ${sizeMB} MB`);
        console.log(`     Thumbnail: ${hasThumbnail ? '✅' : '❌'}`);
        console.log(`     Created: ${file.created_at || 'unknown'}`);
        console.log('');
      });
      
      if (fullImages.length > 10) {
        console.log(`  ... and ${fullImages.length - 10} more files\n`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error checking bucket: ${error}`);
    }
  }
}

checkStorageBuckets();

