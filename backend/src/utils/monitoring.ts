/**
 * Database monitoring queries
 * Run these queries periodically to monitor database size and storage usage
 */

export const MONITORING_QUERIES = {
  // Get total database size
  databaseSize: `
    SELECT 
      pg_size_pretty(pg_database_size(current_database())) as database_size,
      pg_database_size(current_database()) as size_bytes;
  `,

  // Get size of each table
  tableSizes: `
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `,

  // Get row counts per table
  rowCounts: `
    SELECT 
      'date_entries' as table_name, COUNT(*) as row_count FROM date_entries
    UNION ALL
    SELECT 
      'milestones', COUNT(*) FROM milestones
    UNION ALL
    SELECT 
      'moments', COUNT(*) FROM moments
    UNION ALL
    SELECT 
      'journal_entries', COUNT(*) FROM journal_entries;
  `,

  // Get storage usage by user (if user_id is populated)
  storageByUser: `
    SELECT 
      user_id,
      COUNT(*) as total_entries,
      (
        SELECT COUNT(*) FROM date_entries WHERE user_id = u.user_id
      ) + (
        SELECT COUNT(*) FROM milestones WHERE user_id = u.user_id
      ) + (
        SELECT COUNT(*) FROM moments WHERE user_id = u.user_id
      ) + (
        SELECT COUNT(*) FROM journal_entries WHERE user_id = u.user_id
      ) as total_entries
    FROM (
      SELECT DISTINCT user_id FROM date_entries WHERE user_id IS NOT NULL
      UNION
      SELECT DISTINCT user_id FROM milestones WHERE user_id IS NOT NULL
      UNION
      SELECT DISTINCT user_id FROM moments WHERE user_id IS NOT NULL
      UNION
      SELECT DISTINCT user_id FROM journal_entries WHERE user_id IS NOT NULL
    ) u
    GROUP BY user_id
    ORDER BY total_entries DESC;
  `,

  // Get photos count and estimate storage
  photosStats: `
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
  `,

  // Get largest tables
  largestTables: `
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
      pg_size_pretty(pg_total_relation_size('public.'||tablename) - pg_relation_size('public.'||tablename)) AS indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size('public.'||tablename) DESC
    LIMIT 10;
  `,
};

/**
 * Execute monitoring query
 * @param query - SQL query string
 * @param supabaseClient - Supabase client instance
 */
export async function executeMonitoringQuery(
  query: string,
  supabaseClient: any
) {
  try {
    const { data, error } = await supabaseClient.rpc('exec_sql', {
      query_text: query,
    });

    if (error) {
      // Fallback: execute via direct query if RPC doesn't exist
      const { data: directData, error: directError } = await supabaseClient
        .from('_monitoring')
        .select('*');

      if (directError) {
        console.error('Monitoring query error:', directError);
        return null;
      }

      return directData;
    }

    return data;
  } catch (error) {
    console.error('Error executing monitoring query:', error);
    return null;
  }
}

