import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto, JournalEntry } from './journal.dto';

@Injectable()
export class JournalService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<JournalEntry[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<JournalEntry> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createDto: CreateJournalEntryDto): Promise<JournalEntry> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .insert([createDto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateDto: UpdateJournalEntryDto): Promise<JournalEntry> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .update(updateDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async findByType(type: string): Promise<JournalEntry[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('journal_entries')
      .select('*')
      .eq('entry_type', type)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data;
  }
}
