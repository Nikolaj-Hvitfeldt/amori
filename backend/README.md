# Backend API Documentation

## Overview

NestJS-based REST API for the Amori journal application. Provides endpoints for managing dates, moments, and milestones with Supabase integration.

## Running the Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm start
```

## Environment Variables

Create a `.env` file in the backend directory:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important Notes:**
- Use `SUPABASE_SERVICE_ROLE_KEY` (service role key), NOT the anon key
- The service role key has full access and bypasses RLS policies
- Find it in Supabase Dashboard > Settings > API > Service Role Key
- You can also use `SUPABASE_KEY` as an alias (it will check both)

## API Endpoints

The API is organized into separate modules:

- **Dates**: `/dates` - Special date entries with mood, location, highlights
- **Moments**: `/moments` - Special moments/stories with photos
- **Milestones**: `/milestones` - Relationship milestones (met, first date, etc.)

See individual module documentation for detailed endpoint specifications.
