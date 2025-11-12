-- Add title column to date_entries table
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Update existing rows to have a default title if they don't have one
-- This creates a title from location and date for existing entries
UPDATE date_entries 
SET title = location || ' - ' || TO_CHAR(date, 'Mon DD, YYYY')
WHERE title IS NULL OR title = '';

