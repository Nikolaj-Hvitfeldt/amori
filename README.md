# Amori 💕

A React Native journal app for documenting your relationship journey with love stories, special dates, cherished milestones, and photo memories.

## Features

- 📱 **Cross-platform** React Native app (iOS, Android, Web)
- 💕 **Moments** - Capture and preserve your special romantic moments with photos
- 📅 **Dates** - Track memorable dates with mood-based theming and location
- 🏆 **Milestones** - Celebrate relationship milestones (first date, engagement, wedding, etc.)
- 📸 **Memory Wall** - Beautiful gallery view of all your photos
- 📊 **Timeline** - Chronological view of all your entries with visual timeline
- 🎨 **Beautiful Animations** - Smooth, polished UI with React Native Reanimated
- 🖼️ **Image Optimization** - Automatic compression and thumbnail generation
- 📱 **PWA Support** - Install as an app on mobile devices

## Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **React Native Reanimated** for smooth animations
- **Expo Image** for optimized image loading
- **React DatePicker** for date selection
- **AsyncStorage** for local caching

### Backend
- **NestJS** REST API
- **TypeScript**
- **Supabase** (PostgreSQL database + Storage)
- **Sharp** for image processing and thumbnail generation
- **HEIC Convert** for iOS image format support

## Project Structure

```
amori/
├── frontend/              # React Native app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   │   ├── TimelineScreen.tsx
│   │   │   ├── MomentsScreen.tsx
│   │   │   ├── DatesScreen.tsx
│   │   │   ├── MilestonesScreen.tsx
│   │   │   └── PicturesScreen.tsx
│   │   ├── components/   # Reusable components
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── AnimatedFAB.tsx
│   │   │   ├── AnimatedModal.tsx
│   │   │   ├── AnimatedTabBar.tsx
│   │   │   ├── PressableCard.tsx
│   │   │   ├── SkeletonLoader.tsx
│   │   │   ├── SuccessCheckmark.tsx
│   │   │   ├── HeartPulse.tsx
│   │   │   ├── WebDatePicker.tsx
│   │   │   └── ThumbnailImage.tsx
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── constants/     # Constants and themes
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── backend/               # NestJS API
│   ├── src/
│   │   ├── moments/       # Moments module
│   │   ├── dates/         # Dates module
│   │   ├── milestones/    # Milestones module
│   │   ├── supabase/      # Supabase integration
│   │   ├── utils/         # Utilities (image processing, etc.)
│   │   └── main.ts
│   ├── migrations/        # Database migrations
│   └── package.json
│
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Supabase account (free tier available)
- For mobile development: Expo Go app or development environment

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Set up database:
   - Run migrations in `backend/migrations/` folder
   - Enable RLS policies (see `backend/migrations/009_enable_rls_policies.sql`)

5. Start the server:
   ```bash
   npm run start:dev
   ```
   
   Server runs on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL in `src/services/api.ts`:
   ```typescript
   const API_URL = Platform.OS === "web"
     ? "http://localhost:3000"
     : "http://YOUR_LOCAL_IP:3000"; // For mobile devices
   ```

4. Start the app:
   ```bash
   npm start
   ```

5. Choose platform:
   - Press `w` for web
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## Database Schema

The app uses three main tables:

### `moments`
- `id` (UUID): Primary key
- `title` (TEXT): Moment title
- `story_date` (DATE): Date of the moment
- `description` (TEXT): Moment description
- `photos` (TEXT[]): Array of photo URLs
- `created_at`, `updated_at` (TIMESTAMP)

### `date_entries`
- `id` (UUID): Primary key
- `title` (TEXT): Optional title
- `date` (DATE): Date of the event
- `location` (TEXT): Location
- `description` (TEXT): Description
- `mood` (TEXT): Mood type (magical, romantic, adventurous, etc.)
- `highlights` (TEXT[]): Array of highlights
- `weather` (TEXT): Optional weather info
- `favorite_moment` (TEXT): Optional favorite moment
- `photos` (TEXT[]): Array of photo URLs
- `created_at`, `updated_at` (TIMESTAMP)

### `milestones`
- `id` (UUID): Primary key
- `milestone_type` (TEXT): Type (met, first_date, official, etc.)
- `title` (TEXT): Milestone title
- `date` (DATE): Date of the milestone
- `description` (TEXT): Optional description
- `photos` (TEXT[]): Array of photo URLs
- `created_at`, `updated_at` (TIMESTAMP)

## API Endpoints

### Moments
- `GET /moments` - Get all moments (with pagination)
- `GET /moments/:id` - Get a specific moment
- `POST /moments` - Create a new moment
- `PATCH /moments/:id` - Update a moment
- `DELETE /moments/:id` - Delete a moment
- `POST /moments/upload-image` - Upload image for moment

### Dates
- `GET /dates` - Get all date entries (with pagination)
- `GET /dates/:id` - Get a specific date entry
- `POST /dates` - Create a new date entry
- `PATCH /dates/:id` - Update a date entry
- `DELETE /dates/:id` - Delete a date entry
- `POST /dates/upload-image` - Upload image for date

### Milestones
- `GET /milestones` - Get all milestones (with pagination)
- `GET /milestones/:id` - Get a specific milestone
- `POST /milestones` - Create a new milestone
- `PATCH /milestones/:id` - Update a milestone
- `DELETE /milestones/:id` - Delete a milestone
- `POST /milestones/upload-image` - Upload image for milestone

## Features in Detail

### Image Handling
- Automatic image compression on upload
- Thumbnail generation for faster loading
- HEIC/HEIF format support (iOS)
- Progressive compression fallback
- Storage cleanup on deletion

### Animations
- Card entrance animations with stagger
- Floating Action Button with bounce
- Press feedback on cards
- Modal slide-in animations
- Success checkmark animation
- Heart pulse animation
- Tab bar indicator animation
- Loading skeleton shimmer

### Date Picker
- Native date picker on mobile
- Custom themed date picker on web
- Prevents future date selection
- Defaults to today's date

### Caching
- Local caching with AsyncStorage (native) / localStorage (web)
- Automatic cache invalidation on updates
- Configurable TTL per resource type

## Security

- Row Level Security (RLS) enabled on all tables
- Service role key used by backend (bypasses RLS)
- Frontend uses backend API (no direct database access)
- Image upload validation and size limits

## Deployment

### Backend
1. Set environment variables on your hosting platform
2. Run database migrations
3. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

### Frontend
1. Update API URL in `src/services/api.ts` to production URL
2. Build for production:
   ```bash
   npm run build
   ```
3. Deploy to your hosting platform (Vercel, Netlify, etc.)

For mobile apps, use EAS Build or build locally.

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
