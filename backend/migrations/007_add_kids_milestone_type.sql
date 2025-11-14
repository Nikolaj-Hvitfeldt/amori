-- Add 'kid' to the milestone_type CHECK constraint
-- This migration updates existing databases that were created before 'kid' was added

-- First, drop the existing constraint
ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_milestone_type_check;

-- Add the new constraint with 'kid' included
ALTER TABLE milestones ADD CONSTRAINT milestones_milestone_type_check 
  CHECK (milestone_type IN ('met', 'first_date', 'official', 'moved_in', 'engagement', 'wedding', 'kid', 'custom'));

