import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JournalModule } from './journal/journal.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule, 
    JournalModule
  ],
})
export class AppModule {}
