-- Create date_entries table
CREATE TABLE IF NOT EXISTS date_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  mood VARCHAR(50) NOT NULL CHECK (mood IN ('magical', 'romantic', 'adventurous', 'cozy', 'spontaneous', 'dreamy')),
  highlights TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs/paths
  weather VARCHAR(255),
  favorite_moment TEXT,
  image_url TEXT, -- Legacy single image field (for backward compatibility)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster querying by date
CREATE INDEX IF NOT EXISTS idx_date_entries_date ON date_entries(date DESC);

-- Create an index on mood for filtering
CREATE INDEX IF NOT EXISTS idx_date_entries_mood ON date_entries(mood);

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_date_entries_updated_at BEFORE UPDATE ON date_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

