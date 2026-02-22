-- =============================================
-- MIGRATION: Remove max_participants column from events table
-- =============================================
-- This migration removes the max_participants/max_riders column from events table
-- and cleans up any related functionality

-- Remove max_participants column from events table if it exists
DO $$ 
BEGIN
    -- Drop max_participants column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='max_participants') THEN
        ALTER TABLE events DROP COLUMN max_participants;
        RAISE NOTICE 'Dropped max_participants column from events table';
    ELSE
        RAISE NOTICE 'Column max_participants does not exist in events table';
    END IF;

    -- Also check for max_riders column (alternative name)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='max_riders') THEN
        ALTER TABLE events DROP COLUMN max_riders;
        RAISE NOTICE 'Dropped max_riders column from events table';
    ELSE
        RAISE NOTICE 'Column max_riders does not exist in events table';
    END IF;
END $$;

-- Clean up any app configuration that might reference max participants/riders functionality
UPDATE app_config 
SET description = 'Registration requirements and settings (max participants removed)'
WHERE config_key = 'registration_settings' AND description LIKE '%max%';

-- Remove any max_events_per_user config as it's no longer needed
DELETE FROM app_config 
WHERE config_key = 'max_events_per_user';

-- Verify the columns were removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('max_participants', 'max_riders');