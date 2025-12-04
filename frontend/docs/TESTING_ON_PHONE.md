# Testing PWA on iPhone 📱

This guide explains how to test your Amori PWA on your iPhone using Safari.

## Prerequisites

1. ✅ Backend is running on your computer
2. ✅ Frontend dev server is running
3. ✅ iPhone and computer are on the **same WiFi network**
4. ✅ Windows Firewall allows connections (if on Windows)

## Step-by-Step Instructions

### 1. Find Your Computer's Local IP Address

**On Windows (PowerShell):**
```powershell
ipconfig | findstr IPv4
```

Look for the IPv4 address under your WiFi adapter (usually starts with `192.168.x.x` or `10.x.x.x`).

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or use the backend script:
```bash
cd backend
npm run get:ip
```

**Example output:** `192.168.1.100` (this is your local IP)

### 2. Start the Frontend Dev Server

Make sure Expo web is accessible on your network:

```bash
cd frontend
npm run web
```

**Important:** When Expo starts, look for a message like:
```
Metro waiting on exp://192.168.1.100:8081
```

If it only shows `localhost`, you may need to configure Expo to bind to all interfaces.

### 3. Access from iPhone

1. **Open Safari** on your iPhone
2. **Type in the address bar:**
   ```
   http://YOUR_LOCAL_IP:8081
   ```
   Replace `YOUR_LOCAL_IP` with the IP from step 1.
   
   Example: `http://192.168.1.100:8081`

3. **Press Go**

### 4. Install as PWA (Optional)

Once the app loads in Safari:

1. Tap the **Share button** (square with arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**
4. The app icon will appear on your home screen!

## Troubleshooting

### Can't Connect - "Safari cannot open the page"

**Check 1: Same WiFi Network**
- Make sure your iPhone and computer are on the same WiFi network
- Try disconnecting and reconnecting both devices

**Check 2: Firewall**
- Windows Firewall might be blocking the connection
- Go to Windows Defender Firewall → Allow an app
- Allow Node.js or the port (8081)

**Check 3: IP Address**
- Verify your IP address is correct
- Run `ipconfig` again - IPs can change when reconnecting to WiFi

**Check 4: Expo Binding**
- Expo might only be binding to localhost
- See "Advanced: Force Network Binding" below

### App Loads But API Calls Fail

**Update API URL:**
1. Check your backend is running: `http://YOUR_LOCAL_IP:3000`
2. Update `frontend/src/services/api.ts`:
   ```typescript
   const API_URL = Platform.OS === "web"
     ? "http://YOUR_LOCAL_IP:3000"  // Use your local IP, not localhost
     : "http://YOUR_LOCAL_IP:3000";
   ```
3. Restart the frontend dev server

### Expo Only Shows localhost

If Expo only binds to localhost, you can force it to use your network IP:

**Option 1: Use LAN flag**
```bash
cd frontend
npx expo start --web --lan
```

**Option 2: Set EXPO_DEVTOOLS_LISTEN_ADDRESS**
```bash
# Windows PowerShell
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
npm run web

# Or in one command:
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"; npm run web
```

**Option 3: Use tunnel (slower but works anywhere)**
```bash
cd frontend
npx expo start --web --tunnel
```

### Port Already in Use

If port 8081 is taken:
```bash
cd frontend
npx expo start --web --port 8082
```

Then access: `http://YOUR_LOCAL_IP:8082`

## Quick Test Checklist

- [ ] Backend running: `http://localhost:3000` works in browser
- [ ] Frontend running: `http://localhost:8081` works in browser
- [ ] Found local IP address
- [ ] iPhone on same WiFi network
- [ ] Can access `http://YOUR_LOCAL_IP:8081` from iPhone
- [ ] API URL updated in `api.ts` (if needed)
- [ ] Windows Firewall allows connections

## Alternative: Use Expo Go App

If web access doesn't work, you can use the Expo Go app:

1. Install **Expo Go** from App Store
2. Start Expo: `cd frontend && npm start`
3. Scan the QR code with Expo Go
4. App will load in Expo Go (not as PWA, but for testing)

## Next Steps

Once it's working:
- Test all features on your iPhone
- Try installing as PWA
- Test offline functionality
- Share the URL with your girlfriend! 💕

