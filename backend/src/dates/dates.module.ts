import { Module } from "@nestjs/common";
import { DatesService } from "./dates.service";
import { DatesController } from "./dates.controller";
import { SupabaseModule } from "../supabase/supabase.module";
import { ImageUploadService } from "../utils/image-upload.service";

@Module({
  imports: [SupabaseModule],
  controllers: [DatesController],
  providers: [DatesService, ImageUploadService],
  exports: [DatesService],
})
export class DatesModule {}
