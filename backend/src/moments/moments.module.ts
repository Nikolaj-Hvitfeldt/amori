import { Module } from "@nestjs/common";
import { MomentsService } from "./moments.service";
import { MomentsController } from "./moments.controller";
import { SupabaseModule } from "../supabase/supabase.module";

@Module({
  imports: [SupabaseModule],
  controllers: [MomentsController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}
