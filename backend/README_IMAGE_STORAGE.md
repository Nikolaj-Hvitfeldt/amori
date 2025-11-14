# Image Storage Best Practices Implementation

This document describes the image storage optimizations implemented in the Amori app.

## ✅ Implemented Features

### 1. Image Compression
- **Server-side compression**: Images are automatically compressed to max 1920x1920px at 85% quality using Sharp
- **Format**: All images are converted to JPEG for optimal compression
- **Location**: `backend/src/utils/image-compression.ts`

### 2. User Ownership & RLS
- **User ID columns**: Added `user_id` to all tables (dates, milestones, moments, journal_entries)
- **Row Level Security**: Enabled RLS policies on all tables
- **Indexes**: Created indexes on `user_id` and composite indexes for common queries
- **Migrations**: 
  - `008_add_user_id_to_all_tables.sql`
  - `009_enable_rls_policies.sql`

### 3. Storage Architecture
- **Files in Storage**: Images stored in Supabase Storage (not in database)
- **Metadata in DB**: Only URLs stored in `TEXT[]` arrays
- **Public URLs**: Using public URLs for CDN caching
- **Buckets**: Separate buckets for different content types (`date-photos`, `milestone-photos`)

### 4. Monitoring
- **SQL Queries**: Comprehensive monitoring queries in `backend/scripts/monitor-db.sql`
- **Metrics Tracked**:
  - Database size
  - Table sizes
  - Row counts
  - Photo statistics
  - Storage by user
  - Index usage

### 5. Backup Scripts
- **Bash script**: `backend/scripts/backup.sh` (Linux/Mac)
- **PowerShell script**: `backend/scripts/backup.ps1` (Windows)
- **Features**:
  - Automatic compression
  - Timestamped backups
  - Keeps last 7 backups

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install `sharp` for image compression.

### 2. Run Database Migrations

Execute the migrations in order:

```sql
-- In Supabase SQL Editor or via psql
\i backend/migrations/008_add_user_id_to_all_tables.sql
\i backend/migrations/009_enable_rls_policies.sql
```

### 3. Configure User Authentication

For RLS to work properly, you need to:
1. Set up Supabase Authentication
2. Ensure `auth.uid()` is available in your queries
3. Update your backend services to include `user_id` when creating records

### 4. Update Backend Services

When creating records, include the `user_id`:

```typescript
// Example: dates.service.ts
async create(createDateEntryDto: CreateDateEntryDto, userId: string) {
  const { data, error } = await this.supabase
    .getClient()
    .from("date_entries")
    .insert([{
      ...createDateEntryDto,
      user_id: userId, // Add user_id
    }])
    .select()
    .single();
  // ...
}
```

## 🔍 Monitoring

### Run Monitoring Queries

Execute queries from `backend/scripts/monitor-db.sql` in Supabase SQL Editor:

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

### Backup Database

**Linux/Mac:**
```bash
chmod +x backend/scripts/backup.sh
./backend/scripts/backup.sh
```

**Windows:**
```powershell
.\backend\scripts\backup.ps1
```

Set `DATABASE_URL` or `SUPABASE_DB_URL` environment variable:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

## ⚠️ Important Notes

### Backward Compatibility
- Existing records may have `user_id = NULL`
- RLS policies allow viewing NULL user_id records (for backward compatibility)
- **Action Required**: Migrate existing data to assign user_ids

### Image Compression
- Compression happens automatically on server-side
- Original images are not stored (only compressed versions)
- If compression fails, original image is used (with warning log)

### RLS Policies
- Policies use `auth.uid()` from Supabase Auth
- Ensure your backend passes authenticated user context
- Test RLS policies after enabling them

## 🚀 Future Improvements

1. **Thumbnail Generation**: Generate thumbnails for list views (300x300px)
2. **Client-side Compression**: Add client-side compression before upload
3. **Progressive Loading**: Load thumbnails first, full images on demand
4. **Storage Quotas**: Implement per-user storage limits
5. **Image Optimization**: Use WebP format where supported

## 📊 Expected Results

After implementing these changes:
- **Image sizes**: Reduced by 60-80% (typical)
- **Storage costs**: Significantly reduced
- **Load times**: Faster image loading
- **Database size**: Minimal (only URLs, not file bytes)
- **Security**: Per-user data isolation via RLS

