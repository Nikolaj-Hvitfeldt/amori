-- Create moments table (originally named love_stories, renamed in migration 003)
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  story_date DATE NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs/paths
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for faster querying by date
CREATE INDEX idx_moments_story_date ON moments(story_date DESC);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE moments ENABLE ROW LEVEL SECURITY;