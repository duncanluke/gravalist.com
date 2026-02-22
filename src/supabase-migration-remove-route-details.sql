-- =============================================
-- MIGRATION: Remove route_details column from events table
-- =============================================
-- This migration removes the route_details column from events table
-- and cleans up any race map/tracking functionality stored in it

-- Remove route_details column from events table if it exists
DO $$ 
BEGIN
    -- Drop route_details column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='route_details') THEN
        ALTER TABLE events DROP COLUMN route_details;
        RAISE NOTICE 'Dropped route_details column from events table';
    ELSE
        RAISE NOTICE 'Column route_details does not exist in events table';
    END IF;
END $$;

-- Clean up any app configuration that might reference route_details functionality
UPDATE app_config 
SET description = 'Registration requirements and settings (route details removed)'
WHERE config_key = 'registration_settings' AND description LIKE '%route%';

-- Remove any race map related config as it's no longer needed
DELETE FROM app_config 
WHERE config_key IN ('race_map_settings', 'tracking_settings', 'route_details_config');

-- Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'route_details';