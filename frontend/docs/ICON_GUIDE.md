# Icon Creation Guide 🎨

This guide will help you create all the necessary icons and splash screens for the Amori app.

## Required Assets

You need to create these files in `frontend/assets/`:

1. **icon.png** - 1024x1024px (Main app icon)
2. **favicon.png** - 48x48px (Browser favicon)
3. **splash.png** - 1242x2436px (Splash screen)
4. **adaptive-icon.png** - 1024x1024px (Android adaptive icon)

## Option 1: Online Icon Generator (Easiest) ⭐

### Step 1: Create Your Base Icon

Create a single 1024x1024px icon design. You can use:
- **Figma** (free): https://www.figma.com
- **Canva** (free): https://www.canva.com
- **GIMP** (free): https://www.gimp.org
- **Photoshop** (paid)

**Design Tips:**
- Use the app's color scheme (pink #FF6B9D, gold #ffd700)
- Keep it simple - icons should be recognizable at small sizes
- Avoid text (it won't be readable at small sizes)
- Use a heart, love symbol, or journal/book theme
- Make sure it looks good on both light and dark backgrounds

### Step 2: Generate All Sizes

Use one of these online tools to generate all required sizes:

**Recommended: AppIcon.co**
1. Go to https://www.appicon.co
2. Upload your 1024x1024px icon
3. Select "Expo" or "React Native"
4. Download the generated package
5. Extract and copy files to `frontend/assets/`

**Alternative: IconKitchen**
1. Go to https://icon.kitchen
2. Upload your icon
3. Generate for Android and iOS
4. Download and extract

**Alternative: RealFaviconGenerator**
1. Go to https://realfavicongenerator.net
2. Upload your icon
3. Generate favicon
4. Download favicon.png

## Option 2: Manual Creation

If you prefer to create them manually:

### icon.png (1024x1024px)
- Main app icon
- Square format
- Transparent or solid background
- Should look good at all sizes

### favicon.png (48x48px)
- Browser tab icon
- Can be a simplified version of main icon
- Usually just the core symbol/logo

### splash.png (1242x2436px)
- Splash screen shown when app loads
- Can be:
  - Your icon centered on background color (#FFF5F7)
  - A simple "Amori" text logo
  - A beautiful background image
- Should match your app's theme

### adaptive-icon.png (1024x1024px)
- Android adaptive icon
- Should be the same as icon.png or a variation
- Will be cropped to different shapes on Android

## Option 3: Using Expo Tools

Expo provides tools to generate icons from a single source:

```bash
cd frontend

# Install expo-cli if not already installed
npm install -g expo-cli

# Generate icons (requires a 1024x1024px source icon)
expo prebuild --clean
```

Or use the Expo Image Utils:

```bash
cd frontend
npx expo install @expo/image-utils
```

## Quick Start: Simple Heart Icon

If you want to get started quickly, here's a simple approach:

1. **Create a simple design:**
   - Use a heart shape (💕)
   - Pink background (#FF6B9D)
   - White or gold heart outline
   - 1024x1024px

2. **Use an online tool:**
   - Go to https://www.appicon.co
   - Upload your design
   - Download the Expo package
   - Extract to `frontend/assets/`

3. **For splash screen:**
   - Use your icon centered
   - Add "Amori" text below if desired
   - Background color: #FFF5F7 (light pink)

## Design Ideas

### Theme 1: Heart Icon
- Pink heart (#FF6B9D) on white/gold background
- Simple, romantic, recognizable

### Theme 2: Journal/Book
- Open book with heart on cover
- Represents the journal aspect

### Theme 3: Love Letter
- Envelope with heart seal
- Classic romantic symbol

### Theme 4: Infinity Heart
- Heart made from infinity symbol
- Represents eternal love

### Theme 5: Polaroid Frame
- Photo frame with heart
- Represents memories/photos

## Color Palette Reference

Use these colors from your app theme:

- **Moments Pink**: #FF6B9D
- **Milestones Gold**: #ffd700
- **Background**: #FFF5F7 (light pink)
- **Dark Background**: #1a0f1a (for dark mode support)
- **Text**: #ffffff or #000000 (depending on background)

## File Structure

After creating your icons, your `frontend/assets/` folder should look like:

```
frontend/assets/
├── icon.png           (1024x1024)
├── favicon.png        (48x48)
├── splash.png         (1242x2436)
└── adaptive-icon.png  (1024x1024)
```

## Verification

After adding your icons:

1. **Check file sizes:**
   ```bash
   cd frontend/assets
   # On Mac/Linux:
   file icon.png
   # On Windows: Check properties in File Explorer
   ```

2. **Test in development:**
   ```bash
   cd frontend
   npm run web
   ```
   - Check browser tab for favicon
   - Check app icon when installing as PWA

3. **Verify in app.json:**
   - All paths should match: `./assets/icon.png`, etc.

## Troubleshooting

### Icons not showing?
- Check file paths in `app.json`
- Verify files exist in `frontend/assets/`
- Check file sizes are correct
- Clear browser cache
- Rebuild: `npm run build:web`

### Icons look blurry?
- Ensure source image is high resolution (1024x1024 minimum)
- Use PNG format (not JPG)
- Don't scale up small images

### Splash screen wrong size?
- Must be exactly 1242x2436px
- Or use a square version and let Expo handle it

## Next Steps

Once you have your icons:

1. ✅ Place all files in `frontend/assets/`
2. ✅ Verify `app.json` paths are correct
3. ✅ Test locally: `npm run web`
4. ✅ Build for production: `npm run build:pwa`
5. ✅ Deploy and test on actual devices

## Resources

- **Figma** (Design): https://www.figma.com
- **AppIcon.co** (Generator): https://www.appicon.co
- **IconKitchen** (Generator): https://icon.kitchen
- **RealFaviconGenerator**: https://realfavicongenerator.net
- **Canva** (Design): https://www.canva.com

Good luck creating your beautiful app icon! 💕

