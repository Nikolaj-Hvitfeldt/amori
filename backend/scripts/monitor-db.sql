-- Database monitoring queries for Amori app
-- Run these queries in Supabase SQL Editor or via psql to monitor database health

-- 1. Total database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_database_size(current_database()) as size_bytes;

-- 2. Table sizes (ordered by size)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Row counts per table
SELECT 
  'date_entries' as table_name, 
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as rows_with_user_id,
  COUNT(*) FILTER (WHERE photos IS NOT NULL AND array_length(photos, 1) > 0) as entries_with_photos
FROM date_entries
UNION ALL
SELECT 
  'milestones', 
  COUNT(*),
  COUNT(*) FILTER (WHERE user_id IS NOT NULL),
  COUNT(*) FILTER (WHERE photos IS NOT NULL AND array_length(photos, 1) > 0)
FROM milestones
UNION ALL
SELECT 
  'moments', 
  COUNT(*),
  COUNT(*) FILTER (WHERE user_id IS NOT NULL),
  COUNT(*) FILTER (WHERE photos IS NOT NULL AND array_length(photos, 1) > 0)
FROM moments
UNION ALL
SELECT 
  'journal_entries', 
  COUNT(*),
  COUNT(*) FILTER (WHERE user_id IS NOT NULL),
  COUNT(*) FILTER (WHERE images IS NOT NULL AND array_length(images, 1) > 0)
FROM journal_entries;

-- 4. Photos statistics
SELECT 
  'date_entries' as source,
  COUNT(*) as entries_with_photos,
  SUM(array_length(photos, 1)) as total_photos
FROM date_entries
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0
UNION ALL
SELECT 
  'milestones',
  COUNT(*),
  SUM(array_length(photos, 1))
FROM milestones
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0
UNION ALL
SELECT 
  'moments',
  COUNT(*),
  SUM(array_length(photos, 1))
FROM moments
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0
UNION ALL
SELECT 
  'journal_entries',
  COUNT(*),
  SUM(array_length(images, 1))
FROM journal_entries
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- 5. Storage usage by user (if user_id is populated)
SELECT 
  user_id,
  (
    SELECT COUNT(*) FROM date_entries WHERE user_id = u.user_id
  ) + (
    SELECT COUNT(*) FROM milestones WHERE user_id = u.user_id
  ) + (
    SELECT COUNT(*) FROM moments WHERE user_id = u.user_id
  ) + (
    SELECT COUNT(*) FROM journal_entries WHERE user_id = u.user_id
  ) as total_entries,
  (
    SELECT COUNT(*) FROM date_entries WHERE user_id = u.user_id AND photos IS NOT NULL AND array_length(photos, 1) > 0
  ) + (
    SELECT COUNT(*) FROM milestones WHERE user_id = u.user_id AND photos IS NOT NULL AND array_length(photos, 1) > 0
  ) + (
    SELECT COUNT(*) FROM moments WHERE user_id = u.user_id AND photos IS NOT NULL AND array_length(photos, 1) > 0
  ) + (
    SELECT COUNT(*) FROM journal_entries WHERE user_id = u.user_id AND images IS NOT NULL AND array_length(images, 1) > 0
  ) as entries_with_photos
FROM (
  SELECT DISTINCT user_id FROM date_entries WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM milestones WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM moments WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM journal_entries WHERE user_id IS NOT NULL
) u
ORDER BY total_entries DESC
LIMIT 20;

-- 6. Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- 7. Check for tables without user_id (for migration tracking)
SELECT 
  'date_entries' as table_name,
  COUNT(*) FILTER (WHERE user_id IS NULL) as rows_without_user_id
FROM date_entries
UNION ALL
SELECT 
  'milestones',
  COUNT(*) FILTER (WHERE user_id IS NULL)
FROM milestones
UNION ALL
SELECT 
  'moments',
  COUNT(*) FILTER (WHERE user_id IS NULL)
FROM moments
UNION ALL
SELECT 
  'journal_entries',
  COUNT(*) FILTER (WHERE user_id IS NULL)
FROM journal_entries;

