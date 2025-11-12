import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl =
      process.env.SUPABASE_URL || "https://your-project.supabase.co";
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

    console.log("Supabase URL:", supabaseUrl);
    console.log(
      "Supabase Service Role Key:",
      supabaseServiceRoleKey ? "Present" : "Missing"
    );

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
