import { Module } from '@nestjs/common';
import { JournalModule } from './journal/journal.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule, JournalModule],
})
export class AppModule {}
