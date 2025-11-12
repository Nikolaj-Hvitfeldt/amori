import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JournalModule } from "./journal/journal.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { MomentsModule } from "./moments/moments.module";
import { DatesModule } from "./dates/dates.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    SupabaseModule,
    JournalModule,
    MomentsModule,
    DatesModule,
  ],
})
export class AppModule {}
