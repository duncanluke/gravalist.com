-- Fix Database Schema - Add Missing Columns for Step Progress Tracking
-- Run this in Supabase SQL Editor

-- =============================================
-- Add missing columns to user_events table
-- =============================================

-- Add missing columns to user_events
ALTER TABLE user_events 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id),
ADD COLUMN IF NOT EXISTS current_step_id INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_phase VARCHAR(20) DEFAULT 'before',
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'registered';

-- =============================================
-- Add missing columns to user_step_progress table
-- =============================================

-- Add missing columns to user_step_progress  
ALTER TABLE user_step_progress
ADD COLUMN IF NOT EXISTS user_event_id UUID REFERENCES user_events(id),
ADD COLUMN IF NOT EXISTS step_id INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS phase VARCHAR(20) NOT NULL DEFAULT 'before',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS step_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =============================================
-- Add unique constraints (with error handling)
-- =============================================

-- Add unique constraint for user_events (user_id, event_id) if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE user_events ADD CONSTRAINT unique_user_event UNIQUE(user_id, event_id);
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Add unique constraint for user_step_progress (user_event_id, step_id) if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE user_step_progress ADD CONSTRAINT unique_user_event_step UNIQUE(user_event_id, step_id);
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Constraint already exists, ignore
        NULL;
END $$;

-- =============================================
-- Add indexes for performance
-- =============================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_events_user_event ON user_events(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_user_step_progress_user_event_step ON user_step_progress(user_event_id, step_id, phase);
CREATE INDEX IF NOT EXISTS idx_user_step_progress_phase ON user_step_progress(phase);
CREATE INDEX IF NOT EXISTS idx_user_step_progress_completed ON user_step_progress(is_completed);

-- =============================================
-- Verify the changes
-- =============================================

-- Check user_events table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_events' 
ORDER BY ordinal_position;

-- Check user_step_progress table structure  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_step_progress' 
ORDER BY ordinal_position;