import { Module } from "@nestjs/common";
import { MomentsService } from "./moments.service";
import { MomentsController } from "./moments.controller";
import { SupabaseModule } from "../supabase/supabase.module";
import { ImageUploadService } from "../utils/image-upload.service";

@Module({
  imports: [SupabaseModule],
  controllers: [MomentsController],
  providers: [MomentsService, ImageUploadService],
  exports: [MomentsService],
})
export class MomentsModule {}
