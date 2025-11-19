/**
 * Quick script to check what's in date_entries photos
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

async function checkDatePhotos() {
  console.log('🔍 Checking date_entries photos...\n');
  
  const { data: entries, error } = await supabase
    .from('date_entries')
    .select('id, title, photos, image_url');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${entries?.length || 0} entries with photos field\n`);

  entries?.forEach((entry: any, index) => {
    console.log(`Entry ${index + 1}:`);
    console.log(`  ID: ${entry.id}`);
    console.log(`  Title: ${entry.title || 'Untitled'}`);
    console.log(`  Photos array:`, entry.photos);
    console.log(`  Photos length:`, Array.isArray(entry.photos) ? entry.photos.length : 'N/A');
    console.log(`  Legacy image_url:`, entry.image_url || 'None');
    if (Array.isArray(entry.photos) && entry.photos.length > 0) {
      entry.photos.forEach((photo: string, i: number) => {
        console.log(`    Photo ${i + 1}: ${photo?.substring(0, 80)}...`);
      });
    }
    if (entry.image_url) {
      console.log(`    Legacy image: ${entry.image_url.substring(0, 80)}...`);
    }
    console.log('');
  });
}

checkDatePhotos();

