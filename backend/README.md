# Backend API Documentation

## Overview

NestJS-based REST API for the Amori relationship journal application. Provides endpoints for managing moments, dates, and milestones with Supabase integration, image processing, and storage management.

## Running the Server

```bash
# Development mode (with hot reload)
npm run start:dev

# Production build
npm run build
npm start
```

The server runs on `http://localhost:3000` by default (or `0.0.0.0:3000` for mobile device access).

## Environment Variables

Create a `.env` file in the backend directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important Notes:**
- Use `SUPABASE_SERVICE_ROLE_KEY` (service role key), NOT the anon key
- The service role key has full access and bypasses RLS policies
- Find it in Supabase Dashboard > Settings > API > Service Role Key
- You can also use `SUPABASE_KEY` as an alias (it will check both)

## Project Structure

```
src/
├── moments/          # Moments module
│   ├── moments.controller.ts
│   ├── moments.service.ts
│   ├── moments.dto.ts
│   └── moments.module.ts
├── dates/            # Dates module
│   ├── dates.controller.ts
│   ├── dates.service.ts
│   ├── dates.dto.ts
│   └── dates.module.ts
├── milestones/       # Milestones module
│   ├── milestones.controller.ts
│   ├── milestones.service.ts
│   ├── milestones.dto.ts
│   └── milestones.module.ts
├── supabase/         # Supabase integration
│   ├── supabase.service.ts
│   └── supabase.module.ts
├── utils/            # Utilities
│   ├── image-upload.service.ts
│   ├── image-compression.ts
│   ├── storage-utils.ts
│   └── supabase-helpers.ts
├── common/            # Shared code
│   ├── exceptions/    # Custom exceptions
│   └── filters/       # Exception filters
├── constants/         # Constants
│   ├── app.constants.ts
│   ├── image.constants.ts
│   └── storage.constants.ts
└── main.ts            # Application entry point
```

## API Endpoints

### Moments

#### Get All Moments
```
GET /moments?limit=10&offset=0
```
Returns paginated list of moments, ordered by date (newest first).

**Query Parameters:**
- `limit` (optional): Number of items per page
- `offset` (optional): Number of items to skip

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "First Kiss",
      "story_date": "2024-01-15",
      "description": "Our first kiss under the stars...",
      "photos": ["https://..."],
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 42
}
```

#### Get Moment by ID
```
GET /moments/:id
```

#### Create Moment
```
POST /moments
Content-Type: application/json

{
  "title": "First Kiss",
  "story_date": "2024-01-15",
  "description": "Our first kiss under the stars...",
  "photos": []
}
```

#### Update Moment
```
PATCH /moments/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description..."
}
```

#### Delete Moment
```
DELETE /moments/:id
```
Deletes the moment and all associated photos from storage.

#### Upload Image
```
POST /moments/upload-image
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

Returns:
```json
{
  "url": "https://.../full-image.jpg",
  "thumbnailUrl": "https://.../full-image_thumb.jpg"
}
```

### Dates

#### Get All Dates
```
GET /dates?limit=10&offset=0
```
Returns paginated list of date entries, ordered by date (newest first).

#### Get Date by ID
```
GET /dates/:id
```

#### Create Date Entry
```
POST /dates
Content-Type: application/json

{
  "title": "Anniversary Dinner",
  "date": "2024-02-14",
  "location": "Fancy Restaurant",
  "description": "Wonderful dinner...",
  "mood": "romantic",
  "highlights": ["Great food", "Beautiful ambiance"],
  "weather": "Clear",
  "favorite_moment": "Dancing under the stars",
  "photos": []
}
```

#### Update Date Entry
```
PATCH /dates/:id
Content-Type: application/json

{
  "mood": "magical",
  "highlights": ["Updated highlight"]
}
```

#### Delete Date Entry
```
DELETE /dates/:id
```
Deletes the date entry and all associated photos from storage.

#### Upload Image
```
POST /dates/upload-image
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

### Milestones

#### Get All Milestones
```
GET /milestones?limit=10&offset=0
```
Returns paginated list of milestones, ordered by date (newest first).

#### Get Milestone by ID
```
GET /milestones/:id
```

#### Create Milestone
```
POST /milestones
Content-Type: application/json

{
  "milestone_type": "first_date",
  "title": "Our First Date",
  "date": "2024-01-10",
  "description": "We went to the movies...",
  "photos": []
}
```

**Milestone Types:**
- `met` - We Met
- `first_date` - First Date
- `official` - Became Official
- `moved_in` - Moved In Together
- `engagement` - Engagement
- `wedding` - Wedding
- `kid` - Kid
- `custom` - Custom Milestone

#### Update Milestone
```
PATCH /milestones/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description..."
}
```

#### Delete Milestone
```
DELETE /milestones/:id
```
Deletes the milestone and all associated photos from storage.

#### Upload Image
```
POST /milestones/upload-image
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}
```

## Image Processing

The backend automatically processes uploaded images:

1. **Format Conversion**: HEIC/HEIF images are converted to JPEG
2. **Compression**: Images are compressed with progressive fallback:
   - Initial: 1920x1920 @ 85% quality
   - Aggressive: 1280x1280 @ 75% quality (if still too large)
   - Maximum: 1024x1024 @ 65% quality (if still too large)
3. **Thumbnail Generation**: 300x300 thumbnails are generated for faster loading
4. **Storage**: Images are stored in Supabase Storage buckets:
   - `moments-photos` - For moments
   - `date-photos` - For dates
   - `milestone-photos` - For milestones

**File Size Limits:**
- Maximum file size: 10MB (before compression)
- Images are automatically resized if they exceed dimensions

## Error Handling

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/moments",
  "method": "POST",
  "message": "Failed to create moment: ...",
  "error": "Bad Request"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors, invalid input)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Database

### Tables

- `moments` - Special moments/stories
- `date_entries` - Special dates with mood and location
- `milestones` - Relationship milestones

### Row Level Security (RLS)

RLS is enabled on all tables. The backend uses the service role key which bypasses RLS policies, allowing full access to all operations.

### Migrations

Database migrations are located in the `migrations/` folder. Run them in order:
1. Create tables
2. Enable RLS
3. Set up policies

## Utilities

### Image Upload Service
Handles image upload, compression, and thumbnail generation.

### Storage Utils
Utilities for managing Supabase Storage:
- `parseStorageUrl()` - Extract bucket and path from URL
- `deleteStorageFiles()` - Delete files and thumbnails from storage

### Supabase Helpers
Common database operations:
- `findAllWithPagination()` - Paginated queries
- `findOneById()` - Find by ID with error handling
- `handleSupabaseError()` - Standardized error handling

## Constants

### Image Constants
- Compression settings (dimensions, quality)
- Thumbnail settings (size, quality)

### Storage Constants
- Bucket names
- File size limits
- Allowed MIME types

### App Constants
- Server configuration (port, host)
- CORS configuration
- Body parser limits
- Pagination defaults

## Development

### Testing Connection
```bash
npx ts-node tests/test-connection.ts
```

### Checking Environment
```bash
npx ts-node tests/check-env.ts
```

## Production Deployment

For detailed deployment instructions, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Quick steps:
1. Set environment variables on your hosting platform
2. Run database migrations if any (or use `schema.sql`)
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```

The server listens on `0.0.0.0:3000` to accept connections from mobile devices on the same network.

**Deployment Platforms:**
- Railway (recommended) - See `docs/DEPLOYMENT.md`
- Render - See `docs/DEPLOYMENT.md`
- VPS/Docker - See `docs/DEPLOYMENT.md`
