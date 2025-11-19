/**
 * Simple script to test Supabase database connection
 * 
 * Usage:
 *   npm run test:connection
 *   OR
 *   npx ts-node test-connection.ts
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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'your-service-role-key';

console.log('🔌 Testing Supabase Connection\n');
console.log('='.repeat(50));

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-service-role-key') {
  console.error('❌ Error: Supabase credentials not configured!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file');
  process.exit(1);
}

console.log(`\n📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...${supabaseKey.substring(supabaseKey.length - 4)}`);
console.log('\n🔄 Connecting...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: List buckets (storage)
    console.log('Test 1: Checking Storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error(`   ❌ Error: ${bucketsError.message}`);
    } else {
      console.log(`   ✅ Success! Found ${buckets?.length || 0} buckets`);
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`      - ${bucket.name}`);
        });
      }
    }

    // Test 2: Query a table (moments)
    console.log('\nTest 2: Querying moments table...');
    const { data: moments, error: momentsError } = await supabase
      .from('moments')
      .select('id, title')
      .limit(5);
    
    if (momentsError) {
      console.error(`   ❌ Error: ${momentsError.message}`);
      console.error(`   Code: ${momentsError.code}`);
      console.error(`   Details: ${momentsError.details}`);
      console.error(`   Hint: ${momentsError.hint}`);
    } else {
      console.log(`   ✅ Success! Found ${moments?.length || 0} moments`);
      if (moments && moments.length > 0) {
        moments.forEach(moment => {
          console.log(`      - ${moment.title || 'Untitled'} (${moment.id.substring(0, 8)}...)`);
        });
      }
    }

    // Test 3: Query date_entries
    console.log('\nTest 3: Querying date_entries table...');
    const { data: dates, error: datesError } = await supabase
      .from('date_entries')
      .select('id, title, date')
      .limit(5);
    
    if (datesError) {
      console.error(`   ❌ Error: ${datesError.message}`);
      console.error(`   Code: ${datesError.code}`);
    } else {
      console.log(`   ✅ Success! Found ${dates?.length || 0} date entries`);
      if (dates && dates.length > 0) {
        dates.forEach(date => {
          console.log(`      - ${date.title || 'Untitled'} (${date.date})`);
        });
      }
    }

    // Test 4: Query milestones
    console.log('\nTest 4: Querying milestones table...');
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, title, date')
      .limit(5);
    
    if (milestonesError) {
      console.error(`   ❌ Error: ${milestonesError.message}`);
      console.error(`   Code: ${milestonesError.code}`);
    } else {
      console.log(`   ✅ Success! Found ${milestones?.length || 0} milestones`);
      if (milestones && milestones.length > 0) {
        milestones.forEach(milestone => {
          console.log(`      - ${milestone.title || 'Untitled'} (${milestone.date})`);
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    const allTestsPassed = !bucketsError && !momentsError && !datesError && !milestonesError;
    
    if (allTestsPassed) {
      console.log('\n✅ All connection tests passed!');
      console.log('   Your database connection is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
      console.log('\n💡 Common issues:');
      console.log('   - Wrong API key (using anon key instead of service role key)');
      console.log('   - Tables don\'t exist (run migrations)');
      console.log('   - RLS policies blocking access');
      console.log('   - Network/firewall issues');
    }

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testConnection();

