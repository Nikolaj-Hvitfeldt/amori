import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl =
      process.env.SUPABASE_URL || "https://your-project.supabase.co";
    // Check both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_KEY for compatibility
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      "your-service-role-key";

    console.log("Supabase URL:", supabaseUrl);
    console.log(
      "Supabase Service Role Key:",
      supabaseServiceRoleKey && supabaseServiceRoleKey !== "your-service-role-key"
        ? "Present"
        : "Missing"
    );

    if (
      !supabaseUrl ||
      supabaseUrl === "https://your-project.supabase.co" ||
      !supabaseServiceRoleKey ||
      supabaseServiceRoleKey === "your-service-role-key"
    ) {
      console.error(
        "⚠️  WARNING: Supabase credentials are not properly configured!"
      );
      console.error(
        "Please set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your .env file"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
