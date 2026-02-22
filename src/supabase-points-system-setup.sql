-- Points System Setup for Gravalist
-- This script ensures all necessary tables and functions exist for the points system

-- Create community_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL,
    invited_email TEXT NOT NULL,
    invitation_message TEXT,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    CONSTRAINT fk_inviter FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on invitation_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_community_invitations_token ON community_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_community_invitations_inviter ON community_invitations(inviter_id);

-- Create points_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    points_type TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id UUID,
    event_id UUID,
    description TEXT,
    is_reversed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_points_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Create indexes for points_activity
CREATE INDEX IF NOT EXISTS idx_points_activity_user ON points_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_points_activity_created ON points_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_points_activity_type ON points_activity(points_type);

-- Ensure users table has total_points column
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create or replace function to award points
CREATE OR REPLACE FUNCTION award_points(
    user_uuid UUID,
    points INTEGER,
    points_type TEXT,
    source_type TEXT,
    source_uuid UUID DEFAULT NULL,
    description_text TEXT DEFAULT NULL,
    event_uuid UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
BEGIN
    -- Insert points activity record
    INSERT INTO points_activity (
        user_id,
        points,
        points_type,
        source_type,
        source_id,
        event_id,
        description
    ) VALUES (
        user_uuid,
        points,
        points_type,
        source_type,
        source_uuid,
        event_uuid,
        description_text
    );
    
    -- Update user's total points
    UPDATE users 
    SET total_points = COALESCE(total_points, 0) + points
    WHERE id = user_uuid
    RETURNING total_points INTO new_total;
    
    RETURN new_total;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to process invitations
CREATE OR REPLACE FUNCTION process_invitation(
    invitation_token_param TEXT,
    new_user_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
    inviter_points INTEGER := 25; -- Points awarded to inviter when invitation is accepted
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record 
    FROM community_invitations 
    WHERE invitation_token = invitation_token_param 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Mark invitation as accepted
    UPDATE community_invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Award points to the inviter (but not if they're inviting themselves)
    IF invitation_record.invited_email != (SELECT email FROM users WHERE id = invitation_record.inviter_id) THEN
        PERFORM award_points(
            invitation_record.inviter_id,
            inviter_points,
            'friend_invite_accepted',
            'invitation',
            invitation_record.id,
            'Friend accepted invitation: ' || new_user_email,
            NULL
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update all existing users to have 0 points if NULL
UPDATE users SET total_points = 0 WHERE total_points IS NULL;