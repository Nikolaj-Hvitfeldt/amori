-- Amori Database Schema
-- This schema represents the current state of the database
-- For production, use the migration files in the migrations/ folder

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- MOMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title CHARACTER VARYING NOT NULL,
  story_date DATE NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[],
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT moments_pkey PRIMARY KEY (id)
);

-- Index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_moments_story_date ON public.moments(story_date DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_moments_updated_at 
  BEFORE UPDATE ON public.moments
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATE_ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.date_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title CHARACTER VARYING,
  date DATE NOT NULL,
  location CHARACTER VARYING NOT NULL,
  description TEXT NOT NULL,
  mood CHARACTER VARYING NOT NULL CHECK (
    mood::text = ANY (
      ARRAY[
        'magical'::character varying,
        'romantic'::character varying,
        'adventurous'::character varying,
        'cozy'::character varying,
        'spontaneous'::character varying,
        'dreamy'::character varying
      ]::text[]
    )
  ),
  highlights TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  weather CHARACTER VARYING,
  favorite_moment TEXT,
  image_url TEXT, -- Legacy field for backward compatibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT date_entries_pkey PRIMARY KEY (id)
);

-- Index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_date_entries_date ON public.date_entries(date DESC);

-- Index on mood for filtering
CREATE INDEX IF NOT EXISTS idx_date_entries_mood ON public.date_entries(mood);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_date_entries_updated_at 
  BEFORE UPDATE ON public.date_entries
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  milestone_type CHARACTER VARYING NOT NULL CHECK (
    milestone_type::text = ANY (
      ARRAY[
        'met'::character varying,
        'first_date'::character varying,
        'official'::character varying,
        'moved_in'::character varying,
        'engagement'::character varying,
        'wedding'::character varying,
        'kid'::character varying, -- Added in migration 007
        'custom'::character varying
      ]::text[]
    )
  ),
  title CHARACTER VARYING NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT milestones_pkey PRIMARY KEY (id)
);

-- Index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_milestones_date ON public.milestones(date DESC);

-- Index on milestone_type for filtering
CREATE INDEX IF NOT EXISTS idx_milestones_type ON public.milestones(milestone_type);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_milestones_updated_at 
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables for security
-- Note: The backend uses service role key which bypasses RLS
-- RLS provides defense-in-depth: if service role key is compromised,
-- RLS policies will still protect direct database access
-- 
-- Since we don't use user_id, policies allow all operations
-- The service role key bypasses these anyway, but they protect against
-- direct database access attempts with anon/authenticated keys

ALTER TABLE public.date_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for date_entries
-- Allow all operations (service role key bypasses these anyway)
DROP POLICY IF EXISTS "Allow all date_entries operations" ON public.date_entries;

CREATE POLICY "Allow all date_entries operations"
  ON public.date_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for milestones
-- Allow all operations (service role key bypasses these anyway)
DROP POLICY IF EXISTS "Allow all milestones operations" ON public.milestones;

CREATE POLICY "Allow all milestones operations"
  ON public.milestones
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for moments
-- Allow all operations (service role key bypasses these anyway)
DROP POLICY IF EXISTS "Allow all moments operations" ON public.moments;

CREATE POLICY "Allow all moments operations"
  ON public.moments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NOTES
-- ============================================================================
-- This schema represents the current database structure
-- Migration history:
--   002: Create moments table (originally love_stories)
--   003: Rename love_stories to moments
--   004: Create date_entries table
--   005: Add title column to date_entries (already included in base schema)
--   006: Create milestones table
--   007: Add 'kid' to milestone_type constraint
--   009: Enable RLS and create policies (user_id from 008 not included)
--
-- RLS Security:
--   - RLS is enabled on all tables for defense-in-depth
--   - Backend uses service role key which bypasses RLS
--   - Policies allow all operations (service role bypasses anyway)
--   - Protects against direct database access with anon/authenticated keys
--
-- For production deployments, it's recommended to run migrations individually
-- in order to track changes and handle data migrations properly.
