-- Add user_id column to all tables for multi-user support and RLS
-- Note: For now, we'll allow NULL user_id for backward compatibility
-- In production, you should migrate existing data to assign user_ids

-- Add user_id to date_entries
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add user_id to milestones
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add user_id to moments
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add user_id to journal_entries
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create indexes on user_id for faster queries (essential for RLS performance)
CREATE INDEX IF NOT EXISTS idx_date_entries_user_id ON date_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);

-- Create composite indexes for common query patterns (user_id + date)
CREATE INDEX IF NOT EXISTS idx_date_entries_user_date ON date_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_user_date ON milestones(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user_date ON moments(user_id, story_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);

