# PWA Setup Guide 📱🌐

This guide explains how to use Amori as both a **Progressive Web App (PWA)** and a **Native App** from the same codebase.

## What is a PWA?

A Progressive Web App (PWA) is a web app that:
- ✅ Works on any device (iOS, Android, Desktop)
- ✅ Can be "installed" on phones (add to home screen)
- ✅ Works offline (with service workers)
- ✅ Looks and feels like a native app
- ✅ **FREE** - No app store fees!
- ✅ Easy to update (just refresh)

## How It Works

Your Expo app can be:
1. **PWA** - Deploy to web hosting (Netlify, Vercel, etc.) - **FREE**
2. **Native App** - Build APK/IPA files when you want to publish later
3. **Both** - Same codebase, different builds!

## Setup Steps

### 1. Create App Icons (Required for PWA)

You'll need these image files in `frontend/assets/`:
- `icon.png` - 1024x1024px (app icon)
- `favicon.png` - 48x48px (browser favicon)
- `splash.png` - 1242x2436px (splash screen)
- `adaptive-icon.png` - 1024x1024px (Android adaptive icon)

**Quick way to generate icons:**
```bash
cd frontend
npx expo install @expo/image-utils
# Or use an online tool like https://www.appicon.co/
```

### 2. Test PWA Locally

```bash
cd frontend
npm run web
```

Then open the URL shown in the terminal (typically `http://localhost:8081` or `http://localhost:19006`). On mobile:
- **Android Chrome**: Menu → "Add to Home screen"
- **iOS Safari**: Share button → "Add to Home Screen"

### 3. Build PWA for Production

```bash
cd frontend
npm run build:pwa
```

This creates a `web-build/` folder with your PWA.

### 4. Deploy PWA (Choose One)

#### Option A: Netlify (Easiest & Free)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
npm run build:pwa
netlify deploy --prod --dir web-build
```

#### Option B: Vercel (Also Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
npm run build:pwa
cd web-build
vercel --prod
```

#### Option C: GitHub Pages

1. Build: `npm run build:pwa`
2. Push `web-build/` to `gh-pages` branch
3. Enable GitHub Pages in repo settings

### 5. Update API URL for Production

Before deploying, update `frontend/src/services/api.ts`:

**Option 1: Environment Variable (Recommended)**
```typescript
import { Platform } from "react-native";

const API_URL =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_API_URL || "https://your-backend.railway.app"
    : process.env.EXPO_PUBLIC_API_URL || "https://your-backend.railway.app";

export const API_BASE_URL = API_URL;
```

Create `.env` file in `frontend/`:
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

**Option 2: Direct Update**
```typescript
import { Platform } from "react-native";

const API_URL =
  Platform.OS === "web"
    ? "https://your-backend.railway.app" // Production backend URL
    : "https://your-backend.railway.app"; // Same for mobile

export const API_BASE_URL = API_URL;
```

**Note:** Make sure your backend CORS settings allow requests from your PWA domain.

## Using the PWA

### On Android:
1. Open the PWA URL in Chrome
2. Tap menu (3 dots) → "Add to Home screen"
3. App appears like a native app!

### On iOS:
1. Open the PWA URL in Safari
2. Tap Share button (square with arrow)
3. Scroll down → "Add to Home Screen"
4. App appears like a native app!

## Building Native Apps Later (Optional)

When you're ready to publish to app stores:

### Android APK (Free):
```bash
cd frontend
eas build --platform android --profile preview
# This creates an APK you can share directly
```

### iOS (Requires Apple Developer Account - $99/year):
```bash
cd frontend
eas build --platform ios
```

## Benefits of PWA Approach

✅ **Free** - No app store fees  
✅ **Fast Updates** - Just redeploy, users get updates automatically  
✅ **Easy Sharing** - Just send a URL  
✅ **Works Everywhere** - iOS, Android, Desktop  
✅ **Offline Support** - Can work without internet (with service workers)  
✅ **No App Store Approval** - Deploy instantly  
✅ **Full Feature Support** - All animations (Reanimated), image optimization (Expo Image), and features work on web  

## Limitations

⚠️ **iOS Safari**: Some PWA features limited (but still works great!)  
⚠️ **Push Notifications**: Limited on iOS (but you can add later)  
⚠️ **App Store**: Can't be in App Store as PWA (but you can build native later)  
⚠️ **Date Picker**: Uses web date picker (React DatePicker) instead of native picker on web  

## Best of Both Worlds

You can:
1. **Start with PWA** - Deploy free, share with your girlfriend
2. **Add native builds later** - When ready for app stores
3. **Same codebase** - No need to maintain separate code!

## Troubleshooting

### PWA not installing?
- Make sure you're using HTTPS (required for PWA)
- Check browser console for errors
- Verify `app.json` web config is correct

### Icons not showing?
- Make sure icon files exist in `frontend/assets/`
- Check file paths in `app.json`
- Rebuild: `npm run build:pwa`

### iOS Home Screen Icon Wrong/Missing?

**The Problem:** iOS Safari caches PWA icons aggressively and may show a default icon instead of your custom one.

**Solution:**
1. **Delete the PWA from home screen** (long press → Remove App)
2. **Clear Safari cache:**
   - Settings → Safari → Clear History and Website Data
3. **Restart dev server:**
   ```bash
   cd frontend
   npm run web:lan
   ```
4. **Re-add to home screen** from Safari
5. **Verify icon path:** Make sure `app.json` has:
   ```json
   "web": {
     "apple": {
       "appleTouchIcon": "./assets/icon.png"
     }
   }
   ```

**Note:** The icon must be a PNG file, ideally 1024x1024px or at least 180x180px for iOS. iOS Safari caches icons very aggressively, so you may need to clear cache and re-add the app.

### API not working?
- Check CORS settings on backend (should allow your PWA domain)
- Verify API URL in production (must use HTTPS)
- Check network tab in browser DevTools
- Ensure backend is accessible from the internet (not just localhost)
- Verify environment variables are set correctly

### Images not loading?
- Check Supabase Storage bucket policies (should be public)
- Verify image URLs are correct
- Check browser console for CORS errors
- Ensure thumbnails are being generated (check backend logs)

## PWA Features in Amori

The following features work great in the PWA:

✅ **Animations** - React Native Reanimated animations work smoothly on web  
✅ **Image Optimization** - Expo Image provides caching and optimization  
✅ **Date Picker** - Custom themed date picker for web  
✅ **Photo Gallery** - Memory wall with polaroid-style display  
✅ **All Screens** - Timeline, Moments, Dates, Milestones, Pictures  
✅ **Image Upload** - Full image upload and compression support  

## Next Steps

1. Create app icons (see step 1)
2. Test locally: `npm run web`
3. Update API URL for production
4. Deploy to Netlify/Vercel
5. Share the URL!

Enjoy your free, beautiful app! 💕
