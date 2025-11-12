import { Module } from "@nestjs/common";
import { DatesService } from "./dates.service";
import { DatesController } from "./dates.controller";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  controllers: [DatesController],
  providers: [DatesService],
  exports: [DatesService],
})
export class DatesModule {}
