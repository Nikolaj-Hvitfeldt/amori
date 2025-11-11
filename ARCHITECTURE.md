# Amori Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Frontend                     │
│                      (TypeScript)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home       │  │   Stories    │  │    Dates     │      │
│  │  Timeline    │  │  Love Stories│  │ Special Dates│      │
│  │     🏠       │  │      💕      │  │      📅      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐                                           │
│  │  Pictures    │                                           │
│  │  Memories    │  Bottom Tab Navigation                    │
│  │     📸       │                                           │
│  └──────────────┘                                           │
│                                                               │
│  Navigation: React Navigation (Bottom Tabs)                  │
│  Styling: NativeWind (Tailwind CSS)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Backend                           │
│                      (TypeScript)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Journal Module                          │     │
│  │                                                      │     │
│  │  • JournalController (REST endpoints)              │     │
│  │  • JournalService (Business logic)                 │     │
│  │  • DTOs (Data Transfer Objects)                    │     │
│  └────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Supabase Module                         │     │
│  │                                                      │     │
│  │  • SupabaseService (Database client)               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│                      (PostgreSQL)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Table: journal_entries                                      │
│  ┌──────────────────────────────────────────────────┐       │
│  │ • id (UUID)                                       │       │
│  │ • title (TEXT)                                    │       │
│  │ • content (TEXT)                                  │       │
│  │ • entry_type (TEXT) - lovestory|date|milestone    │       │
│  │ • entry_date (DATE)                               │       │
│  │ • images (TEXT[])                                 │       │
│  │ • created_at (TIMESTAMP)                          │       │
│  │ • updated_at (TIMESTAMP)                          │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Reading Entries
1. User opens app → HomeScreen component loads
2. Component calls `journalService.getAll()` from frontend
3. Frontend makes HTTP GET request to `http://localhost:3000/journal`
4. Backend JournalController receives request
5. JournalService queries Supabase database
6. Data flows back through the stack to the UI
7. React Native renders the timeline with entries

### Creating an Entry
1. User fills form and submits
2. Frontend calls `journalService.create(entry)`
3. HTTP POST to `http://localhost:3000/journal`
4. Backend validates data with DTOs
5. JournalService inserts into Supabase
6. New entry returned to frontend
7. UI updates with new entry

## Key Technologies

### Frontend
- **React Native**: Cross-platform mobile framework
- **TypeScript**: Static typing for JavaScript
- **NativeWind**: Tailwind CSS implementation for React Native
- **React Navigation**: Navigation library with bottom tabs
- **Supabase JS Client**: Direct database access (optional)

### Backend
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe backend development
- **Supabase JS**: PostgreSQL database client
- **Express**: HTTP server (bundled with NestJS)

### Database
- **Supabase**: PostgreSQL database with REST API
- **PostgreSQL**: Relational database
- **Row Level Security**: Built-in Supabase security

## Color Scheme

The app uses a romantic pink theme:
- **Primary**: #FF6B9D (Pink)
- **Secondary**: #FEC7D7 (Light Pink)
- **Accent**: #A0E7E5 (Teal)
- **Background**: #FFF5F7 (Off-white)

## Entry Types

1. **Love Story** (💕): Romantic moments and memories
2. **Date** (📅): Special dates and anniversaries
3. **Milestone** (⭐): Important relationship milestones
4. **General** (📝): Day-to-day entries
