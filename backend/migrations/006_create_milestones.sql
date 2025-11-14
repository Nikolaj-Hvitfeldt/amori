-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('met', 'first_date', 'official', 'moved_in', 'engagement', 'wedding', 'kid', 'custom')),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs/paths
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date DESC);

-- Create an index on milestone_type for filtering
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

