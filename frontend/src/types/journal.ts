export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateJournalEntry {
  title: string;
  content: string;
  entry_type: 'lovestory' | 'date' | 'milestone' | 'general';
  entry_date: string;
  images?: string[];
}
