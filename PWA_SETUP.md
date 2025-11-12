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

Then open `http://localhost:8081` in your browser. On mobile:
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

```typescript
// For production PWA
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.railway.app';

// For local development
// const API_URL = "http://192.168.0.92:3000";
```

Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

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

## Limitations

⚠️ **iOS Safari**: Some PWA features limited (but still works great!)  
⚠️ **Push Notifications**: Limited on iOS (but you can add later)  
⚠️ **App Store**: Can't be in App Store as PWA (but you can build native later)  

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

### API not working?
- Check CORS settings on backend
- Verify API URL in production
- Check network tab in browser DevTools

## Next Steps

1. Create app icons (see step 1)
2. Test locally: `npm run web`
3. Deploy to Netlify/Vercel
4. Share the URL with your girlfriend!
5. Both of you can "install" it on your phones

Enjoy your free, beautiful app! 💕

