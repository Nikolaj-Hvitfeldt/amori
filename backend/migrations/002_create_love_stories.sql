-- Create love_stories table
CREATE TABLE love_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  story_date DATE NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs/paths
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for faster querying by date
CREATE INDEX idx_love_stories_story_date ON love_stories(story_date DESC);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE love_stories ENABLE ROW LEVEL SECURITY;