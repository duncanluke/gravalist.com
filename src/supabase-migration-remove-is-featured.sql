-- =============================================
-- MIGRATION: Remove is_featured column from events table
-- =============================================
-- This migration removes the is_featured column from events table
-- and cleans up any related functionality

-- Remove is_featured column from events table if it exists
DO $$ 
BEGIN
    -- Drop is_featured column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='is_featured') THEN
        ALTER TABLE events DROP COLUMN is_featured;
        RAISE NOTICE 'Dropped is_featured column from events table';
    ELSE
        RAISE NOTICE 'Column is_featured does not exist in events table';
    END IF;
END $$;

-- Clean up any app configuration that might reference featured events functionality
-- Note: We keep the featured_events config as it uses featured_order instead
UPDATE app_config 
SET description = 'List of event slugs to feature on homepage (uses featured_order column)'
WHERE config_key = 'featured_events' AND description LIKE '%is_featured%';

-- Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'is_featured';