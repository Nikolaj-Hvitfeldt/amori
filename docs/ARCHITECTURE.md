# Amori Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│              React Native Frontend (Expo)                    │
│                      (TypeScript)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home        │  │   Moments    │  │    Dates     │      │
│  │  Timeline     │  │  Love Stories│  │ Special Dates│      │
│  │     🏠        │  │      💕      │  │      📅      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │  Milestones  │  │  Pictures    │                          │
│  │      🏆      │  │  Memory Wall │                          │
│  │              │  │     📸       │                          │
│  └──────────────┘  └──────────────┘                          │
│                                                               │
│  Navigation: Custom Animated Tab Bar                         │
│  Animations: React Native Reanimated                          │
│  Images: Expo Image (with caching)                            │
│  Date Picker: React DatePicker (web) / Native (mobile)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Backend                          │
│                      (TypeScript)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Moments Module                           │     │
│  │  • MomentsController (REST endpoints)               │     │
│  │  • MomentsService (Business logic)                  │     │
│  │  • DTOs (Data Transfer Objects)                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Dates Module                              │     │
│  │  • DatesController (REST endpoints)                │     │
│  │  • DatesService (Business logic)                   │     │
│  │  • DTOs with mood validation                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Milestones Module                        │     │
│  │  • MilestonesController (REST endpoints)          │     │
│  │  • MilestonesService (Business logic)             │     │
│  │  • DTOs with milestone type validation             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Image Upload Service                     │     │
│  │  • Image compression (Sharp)                        │     │
│  │  • Thumbnail generation                            │     │
│  │  • HEIC/HEIF conversion                           │     │
│  │  • Supabase Storage upload                         │     │
│  └────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Supabase Module                          │     │
│  │  • SupabaseService (Database client)              │     │
│  │  • Service role key (bypasses RLS)                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client (Service Role)
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│              (PostgreSQL + Storage)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables:                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │ moments                                          │       │
│  │ • id (UUID)                                       │       │
│  │ • title (VARCHAR)                                 │       │
│  │ • story_date (DATE)                               │       │
│  │ • description (TEXT)                                │       │
│  │ • photos (TEXT[])                                 │       │
│  │ • created_at, updated_at (TIMESTAMP)              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ date_entries                                     │       │
│  │ • id (UUID)                                       │       │
│  │ • title (VARCHAR, optional)                       │       │
│  │ • date (DATE)                                     │       │
│  │ • location (VARCHAR)                              │       │
│  │ • description (TEXT)                              │       │
│  │ • mood (VARCHAR) - magical/romantic/etc.          │       │
│  │ • highlights (TEXT[])                             │       │
│  │ • photos (TEXT[])                                 │       │
│  │ • weather, favorite_moment (TEXT, optional)       │       │
│  │ • created_at, updated_at (TIMESTAMP)              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ milestones                                       │       │
│  │ • id (UUID)                                       │       │
│  │ • milestone_type (VARCHAR) - met/first_date/etc. │       │
│  │ • title (VARCHAR)                                 │       │
│  │ • date (DATE)                                     │       │
│  │ • description (TEXT, optional)                     │       │
│  │ • photos (TEXT[])                                 │       │
│  │ • created_at, updated_at (TIMESTAMP)              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  Storage Buckets:                                            │
│  • moments-photos                                            │
│  • date-photos                                               │
│  • milestone-photos                                           │
│                                                               │
│  Security:                                                   │
│  • Row Level Security (RLS) enabled                          │
│  • Service role key bypasses RLS                             │
│  • Policies allow all operations (defense-in-depth)          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Reading Entries
1. User opens app → Screen component loads
2. Component calls service (e.g., `momentsService.getAllMoments()`)
3. Frontend makes HTTP GET request to backend API
4. Backend Controller receives request
5. Service queries Supabase database using service role key
6. Data flows back through the stack to the UI
7. React Native renders with animations and optimized images

### Creating an Entry
1. User fills form and submits
2. If images: Frontend compresses and uploads to backend
3. Backend processes images (compression, thumbnail generation)
4. Backend uploads to Supabase Storage
5. Frontend calls service (e.g., `momentsService.createMoment()`)
6. HTTP POST to backend API with entry data + photo URLs
7. Backend validates data with DTOs
8. Service inserts into Supabase
9. New entry returned to frontend
10. UI updates with success animation

### Image Upload Flow
1. User selects image(s) from camera/gallery
2. Frontend compresses image (web) or uses ImagePicker quality (native)
3. Image converted to base64
4. POST to `/moments/upload-image` (or dates/milestones)
5. Backend extracts base64, validates MIME type
6. Backend compresses with Sharp (progressive fallback)
7. Backend generates thumbnail (300x300)
8. Both uploaded to Supabase Storage
9. URLs returned to frontend
10. Frontend includes URLs in entry creation

## Key Technologies

### Frontend
- **React Native with Expo**: Cross-platform mobile framework
- **TypeScript**: Static typing for JavaScript
- **React Native Reanimated**: Smooth, performant animations
- **Expo Image**: Optimized image loading and caching
- **React DatePicker**: Custom themed date picker for web
- **AsyncStorage / localStorage**: Local caching
- **Expo ImagePicker**: Camera and photo library access
- **Expo FileSystem**: File handling

### Backend
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe backend development
- **Supabase JS**: PostgreSQL database client
- **Sharp**: Image processing and thumbnail generation
- **HEIC Convert**: iOS image format support
- **Express**: HTTP server (bundled with NestJS)

### Database
- **Supabase**: PostgreSQL database with REST API
- **PostgreSQL**: Relational database
- **Row Level Security**: Enabled for defense-in-depth
- **Supabase Storage**: Image storage with public buckets

## Color Scheme

The app uses theme-based colors:

### Moments
- **Primary**: #FF6B9D (Pink)
- **Background**: #1a0f1a (Dark)
- **Text**: #ffd1e0 (Light Pink)

### Dates
- **Mood-based**: Magical (Purple), Romantic (Pink), Adventurous (Gold), etc.
- **Time-based**: Morning (Warm), Afternoon (Blue), Evening (Sunset), Night (Dark Purple)

### Milestones
- **Primary**: #ffd700 (Gold)
- **Background**: #2d1810 (Dark Brown)
- **Text**: #ffd700 (Gold)

### Timeline
- **Background**: #F5E6D3 (Warm Beige)
- **Rope**: #FFD700 (Gold)

## Entry Types

1. **Moments** (💕): Special romantic moments and stories
2. **Dates** (📅): Memorable dates with mood, location, and highlights
3. **Milestones** (🏆): Relationship milestones (met, first date, engagement, etc.)
4. **Pictures** (📸): Gallery view of all photos across entries

## Security Architecture

### Row Level Security (RLS)
- RLS enabled on all tables
- Policies allow all operations (service role bypasses anyway)
- Provides defense-in-depth if service role key is compromised
- Protects against direct database access with anon/authenticated keys

### Backend Security
- Service role key stored in environment variables
- Never exposed to frontend
- Bypasses RLS for all operations
- Validates all inputs with DTOs

### Image Security
- File size limits (10MB max)
- MIME type validation
- Automatic compression
- Thumbnail generation for performance
