export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date: string;
  images?: string[];
  metadata?: {
    location?: string;
    rating?: number;
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export class CreateJournalEntryDto {
  title: string;
  content: string;
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date: string;
  images?: string[];
  metadata?: {
    location?: string;
    rating?: number;
    tags?: string[];
    [key: string]: any;
  };
}

export class UpdateJournalEntryDto {
  title?: string;
  content?: string;
  entry_type?: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date?: string;
  images?: string[];
  metadata?: {
    location?: string;
    rating?: number;
    tags?: string[];
    [key: string]: any;
  };
}
