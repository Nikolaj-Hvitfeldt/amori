import { Module } from "@nestjs/common";
import { MilestonesService } from "./milestones.service";
import { MilestonesController } from "./milestones.controller";
import { SupabaseModule } from "../supabase/supabase.module";
import { ImageUploadService } from "../utils/image-upload.service";

@Module({
  imports: [SupabaseModule],
  controllers: [MilestonesController],
  providers: [MilestonesService, ImageUploadService],
  exports: [MilestonesService],
})
export class MilestonesModule {}

