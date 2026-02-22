-- =============================================
-- MIGRATION: Clean up unused fields in events table
-- =============================================
-- This migration removes redundant/unused fields and fixes broken ones

-- 1. Remove redundant event_time column (form combines date+time into event_date)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='event_time') THEN
        ALTER TABLE events DROP COLUMN event_time;
        RAISE NOTICE 'Dropped redundant event_time column from events table';
    ELSE
        RAISE NOTICE 'Column event_time does not exist in events table';
    END IF;
END $$;

-- 2. Remove event_status column if it's not being used
-- (Uncomment this if you want to remove event_status)
/*
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='events' AND column_name='event_status') THEN
        ALTER TABLE events DROP COLUMN event_status;
        RAISE NOTICE 'Dropped unused event_status column from events table';
    ELSE
        RAISE NOTICE 'Column event_status does not exist in events table';
    END IF;
END $$;
*/

-- 3. Verify remaining event table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;