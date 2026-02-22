-- =============================================
-- Email Reminder Tracking System
-- =============================================
-- This migration adds columns to track email reminders sent to users
-- for incomplete registrations

-- Add email reminder tracking columns to user_events table
ALTER TABLE user_events 
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_phase VARCHAR(20); -- tracks which phase reminder was sent for

-- Add comments for documentation
COMMENT ON COLUMN user_events.last_reminder_sent_at IS 'Timestamp of the last incomplete registration reminder email sent';
COMMENT ON COLUMN user_events.reminder_count IS 'Total number of reminder emails sent for this registration';
COMMENT ON COLUMN user_events.reminder_phase IS 'The phase (register/start_line/end) for which the last reminder was sent';

-- Create index for querying incomplete registrations
CREATE INDEX IF NOT EXISTS idx_user_events_incomplete 
ON user_events(registration_status, last_reminder_sent_at, current_phase)
WHERE registration_status != 'completed';

-- Create index for reminder scheduling queries
CREATE INDEX IF NOT EXISTS idx_user_events_reminder_eligible
ON user_events(updated_at, last_reminder_sent_at)
WHERE registration_status != 'completed';

-- =============================================
-- Email Reminder Activity Log
-- =============================================
-- Track all email reminder sends for analytics and debugging

CREATE TABLE IF NOT EXISTS email_reminder_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_event_id UUID REFERENCES user_events(id) ON DELETE CASCADE,
    
    -- Email details
    reminder_phase VARCHAR(20) NOT NULL, -- register, start_line, end
    recipient_email VARCHAR(255) NOT NULL,
    user_display_name VARCHAR(255),
    event_name VARCHAR(255) NOT NULL,
    
    -- Sending details
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mailersend_message_id VARCHAR(255),
    
    -- User state at time of send
    current_step_id INTEGER,
    days_since_last_activity DECIMAL(10,2),
    days_until_event DECIMAL(10,2),
    
    -- Response tracking (can be updated later via webhooks)
    email_opened BOOLEAN DEFAULT FALSE,
    email_clicked BOOLEAN DEFAULT FALSE,
    user_completed_after_email BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email reminder log
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_user ON email_reminder_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_event ON email_reminder_log(event_id);
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_sent_at ON email_reminder_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_phase ON email_reminder_log(reminder_phase);

-- Add comments
COMMENT ON TABLE email_reminder_log IS 'Tracks all incomplete registration reminder emails sent to users';
COMMENT ON COLUMN email_reminder_log.days_since_last_activity IS 'Number of days since user last interacted with registration';
COMMENT ON COLUMN email_reminder_log.days_until_event IS 'Number of days until event date (negative if past)';

-- =============================================
-- Helper Function: Get Reminder Eligible Users
-- =============================================

CREATE OR REPLACE FUNCTION get_reminder_eligible_registrations()
RETURNS TABLE (
    user_event_id UUID,
    user_id UUID,
    event_id UUID,
    user_email VARCHAR,
    display_name VARCHAR,
    event_name VARCHAR,
    event_date DATE,
    event_location VARCHAR,
    event_slug VARCHAR,
    current_step_id INTEGER,
    current_phase VARCHAR,
    last_activity TIMESTAMP WITH TIME ZONE,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER,
    recommended_phase VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id as user_event_id,
        ue.user_id,
        ue.event_id,
        u.email as user_email,
        u.display_name,
        e.name as event_name,
        e.event_date,
        e.location as event_location,
        e.slug as event_slug,
        ue.current_step_id,
        ue.current_phase,
        ue.updated_at as last_activity,
        ue.last_reminder_sent_at as last_reminder_sent,
        ue.reminder_count,
        -- Determine recommended phase for reminder
        CASE 
            WHEN ue.current_step_id >= 15 THEN 'end'::VARCHAR
            WHEN ue.current_step_id >= 10 THEN 'start_line'::VARCHAR
            ELSE 'register'::VARCHAR
        END as recommended_phase
    FROM user_events ue
    JOIN users u ON ue.user_id = u.id
    JOIN events e ON ue.event_id = e.id
    WHERE 
        -- Not completed
        (ue.registration_status IS NULL OR ue.registration_status != 'completed')
        -- Has some activity (not brand new)
        AND ue.current_step_id > 0
        -- Either never sent reminder, or last reminder was >24 hours ago
        AND (
            ue.last_reminder_sent_at IS NULL 
            OR ue.last_reminder_sent_at < NOW() - INTERVAL '24 hours'
        )
        -- Last activity was >24 hours ago
        AND ue.updated_at < NOW() - INTERVAL '24 hours'
        -- Don't spam - max 3 reminders per registration
        AND (ue.reminder_count IS NULL OR ue.reminder_count < 3)
    ORDER BY ue.updated_at ASC; -- Oldest inactivity first
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_reminder_eligible_registrations IS 'Returns users eligible for incomplete registration reminder emails';

-- =============================================
-- Helper Function: Update Reminder Stats
-- =============================================

CREATE OR REPLACE FUNCTION update_reminder_sent(
    p_user_event_id UUID,
    p_phase VARCHAR
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_events
    SET 
        last_reminder_sent_at = NOW(),
        reminder_count = COALESCE(reminder_count, 0) + 1,
        reminder_phase = p_phase,
        updated_at = NOW()
    WHERE id = p_user_event_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_reminder_sent IS 'Updates user_events table after sending a reminder email';

-- =============================================
-- Grant necessary permissions
-- =============================================

-- Grant permissions to authenticated users (if needed)
-- ALTER TABLE email_reminder_log ENABLE ROW LEVEL SECURITY;

-- Note: Adjust permissions based on your security requirements
-- These are typically managed by service role for background jobs
