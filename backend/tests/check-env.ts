/**
 * Diagnostic script to check environment variable configuration
 * 
 * Usage:
 *   npm run check:env
 *   OR
 *   npx ts-node check-env.ts
 */

// Load environment variables from .env file first
import * as fs from 'fs';
import * as path from 'path';

// Simple .env loader
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

console.log('🔍 Environment Variable Diagnostic\n');
console.log('='.repeat(50));

// Check if .env file exists (envPath already declared above)
const envExists = fs.existsSync(envPath);

console.log(`\n📁 .env file: ${envExists ? '✅ Found' : '❌ Not found'}`);
if (envExists) {
  console.log(`   Location: ${envPath}`);
} else {
  console.log(`   Expected location: ${envPath}`);
  console.log(`   💡 Create a .env file in the backend directory`);
}

// Try to load .env file manually (for diagnostic purposes)
if (envExists) {
  console.log('\n📝 Reading .env file...');
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    const envVars: { [key: string]: boolean } = {};
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_KEY'
    ];
    
    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = true;
        
        // Check if value is a placeholder
        const isPlaceholder = 
          value.includes('your-project') ||
          value.includes('your-service-role-key') ||
          value.includes('your-anon-key') ||
          value === '' ||
          value === '""' ||
          value === "''";
        
        if (isPlaceholder) {
          console.log(`   ⚠️  Line ${index + 1}: ${key} = [PLACEHOLDER/EMPTY]`);
        } else {
          // Show first/last few chars for security
          const displayValue = value.length > 20 
            ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
            : '***';
          console.log(`   ✅ Line ${index + 1}: ${key} = ${displayValue}`);
        }
      } else if (line.trim()) {
        console.log(`   ⚠️  Line ${index + 1}: Invalid format (not key=value)`);
      }
    });
    
    // Check for required variables
    console.log('\n🔑 Required Environment Variables:');
    requiredVars.forEach(varName => {
      if (envVars[varName]) {
        console.log(`   ✅ ${varName} - Found`);
      } else {
        console.log(`   ❌ ${varName} - Missing`);
      }
    });
    
    // Check for common naming issues
    console.log('\n🔍 Checking for common naming issues...');
    const commonIssues: string[] = [];
    
    if (envVars['SUPABASE_URL'] && !envVars['SUPABASE_SERVICE_ROLE_KEY'] && !envVars['SUPABASE_KEY']) {
      commonIssues.push('SUPABASE_URL found but no key found (need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY)');
    }
    
    if (envVars['SUPABASE_ANON_KEY'] && !envVars['SUPABASE_SERVICE_ROLE_KEY']) {
      commonIssues.push('Found SUPABASE_ANON_KEY but backend needs SUPABASE_SERVICE_ROLE_KEY (service role key, not anon key)');
    }
    
    if (commonIssues.length > 0) {
      commonIssues.forEach(issue => console.log(`   ⚠️  ${issue}`));
    } else {
      console.log('   ✅ No common issues detected');
    }
    
  } catch (error) {
    console.error(`   ❌ Error reading .env file: ${error}`);
  }
}

// Check process.env (what the app actually sees)
console.log('\n🌐 Process Environment Variables:');
const processEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_KEY',
  'SUPABASE_ANON_KEY'
];

processEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = value.length > 20 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`   ✅ ${varName} = ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName} = [NOT SET]`);
  }
});

// Summary and recommendations
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary & Recommendations:\n');

if (!envExists) {
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add the following variables:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('   (or SUPABASE_KEY=your-service-role-key)');
} else {
  const hasUrl = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project');
  const hasKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) && 
                 !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').includes('your-service-role-key');
  
  if (hasUrl && hasKey) {
    console.log('✅ Environment variables look good!');
    console.log('   If you\'re still having issues, make sure:');
    console.log('   - The backend server is restarted after changing .env');
    console.log('   - You\'re using SUPABASE_SERVICE_ROLE_KEY (not anon key)');
  } else {
    console.log('⚠️  Some environment variables may need attention:');
    if (!hasUrl) {
      console.log('   - SUPABASE_URL should be your actual Supabase project URL');
    }
    if (!hasKey) {
      console.log('   - SUPABASE_SERVICE_ROLE_KEY should be your service role key (not anon key)');
      console.log('   - Find it in Supabase Dashboard > Settings > API');
    }
  }
}

console.log('\n💡 Note: NestJS ConfigModule should automatically load .env files');
console.log('   If variables aren\'t loading, try:');
console.log('   1. Restart the backend server');
console.log('   2. Check that .env is in the backend/ directory');
console.log('   3. Make sure there are no spaces around the = sign');
console.log('   4. Don\'t use quotes around values (unless they contain spaces)');

