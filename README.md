# Amori 💕

A beautiful React Native journal app for documenting your relationship journey with love stories, special dates, and cherished milestones.

## Features

- 📱 **React Native** frontend with TypeScript
- 🎨 **NativeWind** (Tailwind CSS) for beautiful, responsive styling
- 🏗️ **NestJS** backend with TypeScript
- 🗄️ **Supabase** as the database
- 🧭 **Bottom Navigation** for easy access to different sections
- 📅 **Timeline View** on the homepage showing all your entries chronologically
- 💕 **Love Stories** section for your favorite romantic moments
- 📆 **Special Dates** for anniversaries and memorable occasions
- 📸 **Memories** gallery for entries with pictures

## Project Structure

```
amori/
├── frontend/          # React Native app
│   ├── src/
│   │   ├── screens/   # Screen components
│   │   ├── navigation/# Navigation setup
│   │   ├── services/  # API and Supabase services
│   │   └── types/     # TypeScript types
│   ├── App.tsx
│   └── package.json
│
└── backend/           # NestJS API
    ├── src/
    │   ├── journal/   # Journal module
    │   ├── supabase/  # Supabase integration
    │   └── main.ts
    ├── schema.sql     # Database schema
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v20 or higher)
- npm
- Supabase account (free tier available)
- React Native development environment (for mobile)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

5. Set up the database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the SQL script from `schema.sql`

6. Start the backend server:
   ```bash
   npm run start:dev
   ```
   
   The backend will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the API URL in `src/services/api.ts` if needed (default: `http://localhost:3000`)

4. Update Supabase credentials in `src/services/supabase.ts`

5. Start the app:
   ```bash
   npm start
   ```

## Database Schema

The app uses a single `journal_entries` table with the following structure:

- `id` (UUID): Primary key
- `title` (TEXT): Entry title
- `content` (TEXT): Entry content
- `entry_type` (TEXT): Type of entry (lovestory, date, milestone, general)
- `entry_date` (DATE): Date of the event
- `images` (TEXT[]): Array of image URLs
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## API Endpoints

- `GET /journal` - Get all entries (optional `?type=` filter)
- `GET /journal/:id` - Get a specific entry
- `POST /journal` - Create a new entry
- `PUT /journal/:id` - Update an entry
- `DELETE /journal/:id` - Delete an entry

## Technologies Used

### Frontend
- React Native
- TypeScript
- NativeWind (Tailwind CSS)
- React Navigation (Bottom Tabs)
- Supabase JS Client

### Backend
- NestJS
- TypeScript
- Supabase
- Express

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
