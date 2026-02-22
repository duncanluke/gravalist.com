-- Migration: Add withdrawal tracking fields to user_events table
-- Date: 2025-01-XX
-- Description: Adds fields to track event withdrawals including reason and timestamp

-- Add withdrawal tracking columns to user_events
ALTER TABLE user_events
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP WITH TIME ZONE;

-- Add index for withdrawn events to improve query performance
CREATE INDEX IF NOT EXISTS idx_user_events_withdrawn ON user_events(registration_status, withdrawn_at)
WHERE registration_status = 'withdrawn';

-- Update registration_status values to include 'withdrawn' if not already documented
-- The field already supports this as it's a VARCHAR(20)
COMMENT ON COLUMN user_events.registration_status IS 'registered, confirmed, started, finished, scratched, dnf, withdrawn';
COMMENT ON COLUMN user_events.withdrawal_reason IS 'Optional reason provided by user when withdrawing from event';
COMMENT ON COLUMN user_events.withdrawn_at IS 'Timestamp when user withdrew from event';
