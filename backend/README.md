# Backend API Documentation

## Overview

NestJS-based REST API for the Amori journal application. Provides endpoints for managing journal entries with Supabase integration.

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
SUPABASE_KEY=your-anon-key
```

## API Endpoints

### Get All Entries
```
GET /journal
Query params: ?type=lovestory|date|milestone|general

Response: JournalEntry[]
```

### Get Single Entry
```
GET /journal/:id

Response: JournalEntry
```

### Create Entry
```
POST /journal
Body: {
  title: string,
  content: string,
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general',
  entry_date: string (ISO 8601),
  images?: string[]
}

Response: JournalEntry
```

### Update Entry
```
PUT /journal/:id
Body: Partial<CreateJournalEntryDto>

Response: JournalEntry
```

### Delete Entry
```
DELETE /journal/:id

Response: void
```

## Data Types

```typescript
interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}
```
