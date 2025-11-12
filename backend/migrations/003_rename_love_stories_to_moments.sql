-- Rename love_stories table to moments
ALTER TABLE love_stories RENAME TO moments;

-- Rename the index
ALTER INDEX idx_love_stories_story_date RENAME TO idx_moments_story_date;

