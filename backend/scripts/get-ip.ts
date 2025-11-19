/**
 * Script to get your current local IP address for mobile device connection
 * 
 * Usage:
 *   npm run get:ip
 *   OR
 *   npx ts-node scripts/get-ip.ts
 */

import * as os from 'os';

function getLocalIP(): string | null {
  const interfaces = os.networkInterfaces();
  
  // Common network interface names
  const interfaceNames = [
    'Wi-Fi',
    'WiFi',
    'Ethernet',
    'en0',
    'eth0',
    'wlan0',
    'Local Area Connection',
    'Wireless Network Connection'
  ];
  
  for (const name of interfaceNames) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        // Get IPv4 addresses that aren't internal
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  
  // Fallback: find any non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  
  return null;
}

const ip = getLocalIP();

console.log('\n🌐 Network Configuration for Mobile Connection\n');
console.log('='.repeat(50));

if (ip) {
  console.log(`\n✅ Found local IP address: ${ip}`);
  console.log(`\n📱 Update your frontend/src/services/api.ts:`);
  console.log(`   Change: "http://172.20.10.3:3000"`);
  console.log(`   To:    "http://${ip}:3000"`);
  console.log(`\n💡 Make sure:`);
  console.log(`   1. Your phone and laptop are on the same WiFi network`);
  console.log(`   2. Your backend is running: npm run start:dev`);
  console.log(`   3. Your Windows Firewall allows connections on port 3000`);
  console.log(`   4. Test the connection: http://${ip}:3000/journal`);
} else {
  console.log('\n❌ Could not detect local IP address');
  console.log('\n💡 Manual steps:');
  console.log('   1. Open Command Prompt or PowerShell');
  console.log('   2. Run: ipconfig');
  console.log('   3. Find your WiFi adapter IPv4 address');
  console.log('   4. Update frontend/src/services/api.ts with that IP');
}

console.log('\n' + '='.repeat(50) + '\n');

