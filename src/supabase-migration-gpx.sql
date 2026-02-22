-- =============================================
-- MIGRATION: Add GPX File Columns to Events Table
-- =============================================
-- This migration adds the new GPX file columns to existing events table

-- Add GPX file columns to events table if they don't exist
DO $$ 
BEGIN
    -- Add gpx_file_path column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='gpx_file_path') THEN
        ALTER TABLE events ADD COLUMN gpx_file_path TEXT;
    END IF;
    
    -- Add gpx_file_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='gpx_file_name') THEN
        ALTER TABLE events ADD COLUMN gpx_file_name VARCHAR(255);
    END IF;
    
    -- Add gpx_file_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='gpx_file_size') THEN
        ALTER TABLE events ADD COLUMN gpx_file_size INTEGER;
    END IF;
    
    -- Add gpx_file_uploaded_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='gpx_file_uploaded_at') THEN
        ALTER TABLE events ADD COLUMN gpx_file_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing events with sample GPX data (optional)
UPDATE events SET 
    gpx_file_path = 'routes/' || slug || '/route.gpx',
    gpx_file_name = slug || '-route.gpx',
    gpx_file_size = CASE slug
        WHEN 'utrecht-500' THEN 245760
        WHEN 'sedgefield-500' THEN 198656
        WHEN 'franschhoek-500' THEN 312320
        WHEN 'cape-hope-500' THEN 267264
        ELSE 250000
    END,
    gpx_file_uploaded_at = created_at
WHERE gpx_file_path IS NULL AND is_published = true;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name LIKE 'gpx_%'
ORDER BY column_name;