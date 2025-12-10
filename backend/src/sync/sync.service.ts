import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

export interface LastUpdatedTimestamps {
  moments: string | null;
  dates: string | null;
  milestones: string | null;
}

@Injectable()
export class SyncService {
  constructor(private readonly supabase: SupabaseService) {}

  async getLastUpdatedTimestamps(): Promise<LastUpdatedTimestamps> {
    const client = this.supabase.getClient();

    // Helper function to get latest timestamp from a table
    const getLatestTimestamp = async (tableName: string): Promise<string | null> => {
      const { data } = await client
        .from(tableName)
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.updated_at || null;
    };

    // Get the latest updated_at timestamp from each table in parallel
    const [moments, dates, milestones] = await Promise.all([
      getLatestTimestamp("moments"),
      getLatestTimestamp("date_entries"),
      getLatestTimestamp("milestones"),
    ]);

    return { moments, dates, milestones };
  }
}

