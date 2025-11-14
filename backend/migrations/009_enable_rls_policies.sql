-- Enable Row Level Security on all tables
ALTER TABLE date_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own date_entries" ON date_entries;
DROP POLICY IF EXISTS "Users can insert own date_entries" ON date_entries;
DROP POLICY IF EXISTS "Users can update own date_entries" ON date_entries;
DROP POLICY IF EXISTS "Users can delete own date_entries" ON date_entries;

DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete own milestones" ON milestones;

DROP POLICY IF EXISTS "Users can view own moments" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;

DROP POLICY IF EXISTS "Users can view own journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal_entries" ON journal_entries;

-- RLS Policies for date_entries
-- Note: During development, these allow NULL user_id. Update to require auth.uid() in production.
CREATE POLICY "Users can view own date_entries"
  ON date_entries FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL for development/backward compatibility

CREATE POLICY "Users can insert own date_entries"
  ON date_entries FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

CREATE POLICY "Users can update own date_entries"
  ON date_entries FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL) -- Allow NULL during development
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own date_entries"
  ON date_entries FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

-- RLS Policies for milestones
-- Note: During development, these allow NULL user_id. Update to require auth.uid() in production.
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own milestones"
  ON milestones FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

CREATE POLICY "Users can update own milestones"
  ON milestones FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL) -- Allow NULL during development
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own milestones"
  ON milestones FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

-- RLS Policies for moments
-- Note: During development, these allow NULL user_id. Update to require auth.uid() in production.
CREATE POLICY "Users can view own moments"
  ON moments FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own moments"
  ON moments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

CREATE POLICY "Users can update own moments"
  ON moments FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL) -- Allow NULL during development
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own moments"
  ON moments FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

-- RLS Policies for journal_entries
-- Note: During development, these allow NULL user_id. Update to require auth.uid() in production.
CREATE POLICY "Users can view own journal_entries"
  ON journal_entries FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert own journal_entries"
  ON journal_entries FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

CREATE POLICY "Users can update own journal_entries"
  ON journal_entries FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL) -- Allow NULL during development
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own journal_entries"
  ON journal_entries FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL); -- Allow NULL during development

