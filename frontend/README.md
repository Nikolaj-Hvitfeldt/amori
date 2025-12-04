# Frontend Documentation

## Overview

React Native application built with Expo for documenting your relationship journey. Features beautiful animations, image optimization, and a polished user experience across iOS, Android, and Web.

## Tech Stack

- **React Native** with Expo - Cross-platform development
- **TypeScript** - Type-safe development
- **React Native Reanimated** - Smooth, performant animations
- **Expo Image** - Optimized image loading and caching
- **React DatePicker** - Custom themed date picker
- **AsyncStorage** / **localStorage** - Local caching
- **Expo ImagePicker** - Camera and photo library access
- **Expo FileSystem** - File handling

## Project Structure

```
src/
├── screens/              # Screen components
│   ├── TimelineScreen.tsx      # Home - Chronological timeline view
│   ├── MomentsScreen.tsx       # Special moments/stories
│   ├── DatesScreen.tsx         # Special dates with mood theming
│   ├── MilestonesScreen.tsx    # Relationship milestones
│   └── PicturesScreen.tsx      # Memory wall - Photo gallery
│
├── components/          # Reusable components
│   ├── AnimatedCard.tsx        # Card entrance animations
│   ├── AnimatedFAB.tsx          # Floating Action Button
│   ├── AnimatedModal.tsx       # Modal slide-in animations
│   ├── AnimatedTabBar.tsx      # Tab bar with indicator
│   ├── PressableCard.tsx      # Card press feedback
│   ├── SkeletonLoader.tsx     # Loading skeleton shimmer
│   ├── SuccessCheckmark.tsx    # Success animation
│   ├── HeartPulse.tsx          # Heart pulse animation
│   ├── WebDatePicker.tsx       # Custom date picker for web
│   ├── ThumbnailImage.tsx      # Image with thumbnail fallback
│   ├── MomentCard.tsx          # Moment card component
│   ├── MomentDetailView.tsx    # Moment detail modal
│   ├── DateCard.tsx            # Date card component
│   ├── DateDetailView.tsx      # Date detail modal
│   ├── MilestoneCard.tsx       # Milestone card component
│   ├── MilestoneDetailView.tsx # Milestone detail modal
│   ├── RotatingPhotoBackground.tsx # Rotating photo background
│   ├── TimelineRope.tsx        # Timeline visual element
│   └── common/                 # Common components
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── LoadingMore.tsx
│       └── DecorativeAccent.tsx
│
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx        # Main navigation with tab bar
│
├── services/           # External services
│   ├── api.ts                 # Backend API configuration
│   ├── moments.ts             # Moments API service
│   ├── dates.ts               # Dates API service
│   ├── milestones.ts          # Milestones API service
│   └── supabase.ts            # Supabase client (currently disabled)
│
├── utils/              # Utility functions
│   ├── cache.ts               # Local caching (AsyncStorage/localStorage)
│   ├── dateUtils.ts           # Date formatting utilities
│   ├── imageUtils.ts          # Image URL utilities
│   ├── imageCompression.ts    # Client-side image compression (web)
│   ├── moodUtils.ts           # Mood colors and options
│   └── shadows.ts             # Platform-specific shadow utilities
│
├── constants/          # Constants and configuration
│   ├── theme.ts               # Color themes and constants
│   ├── spacing.ts             # Spacing and layout constants
│   └── milestoneConfig.ts     # Milestone type configurations
│
└── types/              # TypeScript type definitions
    ├── moments.ts
    ├── dates.ts
    └── milestones.ts
```

## Running the App

### Development

```bash
# Start Metro bundler
npm start

# Run on specific platform
npm run web      # Web browser
npm run ios      # iOS simulator
npm run android  # Android emulator
```

### Mobile Device Access

1. Ensure your device is on the same network as your development machine
2. Update `src/services/api.ts` with your local IP address:
   ```typescript
   const API_URL = Platform.OS === "web"
     ? "http://localhost:3000"
     : "http://YOUR_LOCAL_IP:3000";
   ```
3. Start the backend server
4. Start the frontend: `npm start`
5. Scan the QR code with Expo Go app (iOS/Android)

## Screens

### Home (Timeline)
- Chronological view of all entries (moments, dates, milestones)
- Visual timeline with rope and charm decorations
- Color-coded by entry type
- Infinite scroll with pagination
- Tap any entry to view details

### Moments
- Create and view special romantic moments
- Photo upload with camera or gallery
- Pink-themed UI
- Animated card list with stagger effect
- Success checkmark on save
- Delete functionality

### Dates
- Track memorable dates with mood-based theming
- Mood options: Magical, Romantic, Adventurous, Cozy, Spontaneous, Dreamy
- Time-of-day based color themes (morning, afternoon, evening, night)
- Location and highlights tracking
- Weather and favorite moment fields
- Photo support

### Milestones
- Celebrate relationship milestones
- Types: Met, First Date, Official, Moved In, Engagement, Wedding, Kid, Custom
- Gold-themed UI
- Photo support
- Chronological display

### Memory Wall (Pictures)
- Gallery view of all photos across all entries
- Polaroid-style photo display
- Tap to view full-size image
- Rotating photo backgrounds
- Organized by entry type

## Features

### Animations

All animations use React Native Reanimated for smooth, 60fps performance:

- **Card Entrance**: Staggered fade-slide animations
- **FAB**: Bounce entrance with scale/rotate on press
- **Card Press**: Scale feedback on press
- **Modal**: Slide-in with spring animation
- **Tab Bar**: Sliding indicator with icon pop-up
- **Success Checkmark**: Circle pop-in with checkmark draw
- **Heart Pulse**: Continuous double-beat pulse
- **Skeleton Loader**: Shimmer effect during loading

### Image Handling

- **Thumbnail Fallback**: Automatically falls back to full image if thumbnail fails
- **Optimized Loading**: Uses Expo Image for caching and optimization
- **Client-side Compression**: Web platform compresses images before upload
- **Progressive Loading**: Thumbnails load first, full images on demand

### Date Picker

- **Web**: Custom themed date picker matching app design
- **Mobile**: Native date picker (iOS spinner, Android calendar)
- **Validation**: Prevents future date selection
- **Default**: Defaults to today's date when creating new entries

### Caching

- **Local Storage**: Caches API responses locally
- **TTL**: Configurable time-to-live per resource type
  - Moments: 30 minutes
  - Dates: 30 minutes
  - Milestones: 1 hour
- **Auto Invalidation**: Cache invalidated on create/update/delete
- **Platform Support**: AsyncStorage (native) / localStorage (web)

### Form Features

- **Image Upload**: Multiple photos per entry
- **Date Selection**: Native date picker with validation
- **Mood Selection**: Visual mood picker for dates
- **Validation**: Required field validation
- **Auto-save Indicators**: Success animations on save

## Configuration

### API URL

Update `src/services/api.ts`:

```typescript
const API_URL = Platform.OS === "web"
  ? "http://localhost:3000"           // Web
  : "http://192.168.0.92:3000";       // Mobile (your local IP)
```

For production, use your deployed backend URL.

### Theme Colors

Colors are defined in `src/constants/theme.ts`:

- **Moments**: Pink theme (`#FF6B9D`)
- **Dates**: Mood-based colors (purple, warm tones)
- **Milestones**: Gold theme (`#ffd700`)
- **Timeline**: Warm beige/cream

### Spacing

Layout constants in `src/constants/spacing.ts`:
- Card margins and padding
- Timeline spacing
- Pagination settings
- Decorative element sizes

## Platform-Specific Notes

### Web
- Uses HTML5 date input (custom styled)
- localStorage for caching
- Canvas API for image compression
- CSS-based shadows

### iOS
- Native date picker (spinner style)
- AsyncStorage for caching
- ImagePicker with quality settings
- Native shadow styles

### Android
- Native date picker (calendar style)
- AsyncStorage for caching
- ImagePicker with quality settings
- Elevation for shadows

## Performance Optimizations

- **FlatList**: Virtualized lists for large datasets
- **Image Caching**: Expo Image automatic caching
- **Thumbnail Loading**: Thumbnails load first, full images on demand
- **Pagination**: Load data in chunks
- **Memoization**: useCallback and useMemo where appropriate
- **Lazy Loading**: Components loaded on demand

## Development Tips

### Adding a New Screen

1. Create component in `src/screens/`
2. Add route in `src/navigation/AppNavigator.tsx`
3. Add tab icon in `src/components/AnimatedTabBar.tsx`
4. Update theme colors if needed

### Adding a New Animation

1. Use React Native Reanimated hooks
2. Consider `ReduceMotion` for accessibility
3. Test on all platforms (web, iOS, Android)
4. Use `useAnimatedStyle` for style animations

### Debugging

- Use React Native Debugger
- Check console logs (filtered in production)
- Test on real devices for accurate performance
- Use Expo DevTools for inspection

## Building for Production

### Web

```bash
npm run build
```

Outputs to `web-build/` directory.

### Mobile

Use EAS Build or build locally:

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Troubleshooting

### Images Not Loading
- Check backend is running
- Verify API URL is correct
- Check network connectivity
- Verify Supabase storage bucket permissions

### Date Picker Not Working
- On web: Check browser console for errors
- On mobile: Ensure `@react-native-community/datetimepicker` is installed
- Verify date format matches backend expectations

### Cache Issues
- Clear cache: Delete app data or localStorage
- Check TTL settings
- Verify cache invalidation on updates

## License

ISC
