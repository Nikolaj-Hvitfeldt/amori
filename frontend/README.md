# Frontend Documentation

## Overview

React Native mobile application for the Amori relationship journal.

## Tech Stack

- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **NativeWind**: Tailwind CSS for React Native
- **React Navigation**: Bottom tab navigation
- **Supabase**: Database integration

## Project Structure

```
src/
├── screens/          # Screen components
│   ├── TimelineScreen.tsx   # Timeline view (Home tab)
│   ├── MomentsScreen.tsx    # Special moments
│   ├── DatesScreen.tsx      # Special dates
│   ├── MilestonesScreen.tsx # Milestones
│   └── PicturesScreen.tsx   # Memory gallery
├── navigation/       # Navigation configuration
│   └── AppNavigator.tsx
├── services/         # External services
│   ├── api.ts               # Backend API calls
│   └── supabase.ts          # Supabase client
└── types/            # TypeScript definitions
    └── journal.ts
```

## Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Screens

### Home (Timeline)

- Displays all journal entries in chronological order
- Timeline visualization with icons based on entry type
- Click on any entry to view details

### Special Moments

- Beautiful interface for capturing and viewing special moments
- Photo integration with camera roll access
- Romantic UI design for preserving intimate memories

### Special Dates

- Shows 'date' type entries
- Great for tracking anniversaries and memorable occasions

### Memories (Pictures)

- Displays entries that have attached images
- Gallery view of your visual memories

## Customization

### Colors

Update the color scheme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#FF6B9D',    // Main pink color
      secondary: '#FEC7D7',  // Light pink
      accent: '#A0E7E5',     // Accent color
      background: '#FFF5F7', // Background
    },
  },
}
```

### API Configuration

Update the backend URL in `src/services/api.ts`:

```typescript
const API_URL = "http://localhost:3000";
```

For production, use your deployed backend URL.
