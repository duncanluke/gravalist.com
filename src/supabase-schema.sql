-- =============================================
-- GRAVALIST ULTRA CYCLING PLATFORM - DATABASE SCHEMA
-- =============================================
-- Self-managed ultra cycling events platform
-- Points-based system with email identification for privacy
-- Mobile-first onboarding with simplified 3-phase process

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE USER MANAGEMENT
-- =============================================

-- Users table with email-based identification for privacy
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Profile data from About You step
    first_name VARCHAR(100),
    last_name VARCHAR(100), 
    city VARCHAR(100),
    display_name VARCHAR(100), -- computed from first_name + last_name
    
    -- Privacy settings
    privacy_settings JSONB DEFAULT '{"showOnLeaderboard": true, "shareProgress": false}'::jsonb,
    
    -- Pure points system (no achievements)
    total_points INTEGER DEFAULT 0,
    
    -- User preferences
    preferred_timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "browser": false}'::jsonb,
    
    -- Premium subscription
    is_premium_subscriber BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'free', -- free, active, past_due, canceled, incomplete, trialing
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, premium, pro
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255)
);

-- =============================================
-- EVENT MANAGEMENT
-- =============================================

-- Events table for 500-series ultra cycling events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    location VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    event_date DATE NOT NULL,
    
    -- Event details
    distance_km INTEGER DEFAULT 500,
    description TEXT,
    route_description TEXT,
    
    -- Event categorization
    event_tags TEXT[] DEFAULT ARRAY['Unsupported', 'Ultracycling'],
    difficulty_level VARCHAR(20) DEFAULT 'Advanced', -- Beginner, Intermediate, Advanced, Expert
    
    -- Registration
    registration_opens_at TIMESTAMP WITH TIME ZONE,
    registration_closes_at TIMESTAMP WITH TIME ZONE,
    event_status VARCHAR(20) DEFAULT 'planned', -- planned, registration_open, registration_closed, active, completed, cancelled
    
    -- Route data
    gpx_file_path TEXT, -- Storage path for GPX file
    gpx_file_name VARCHAR(255), -- Original filename
    gpx_file_size INTEGER, -- File size in bytes
    gpx_file_uploaded_at TIMESTAMP WITH TIME ZONE, -- When file was uploaded
    
    -- Admin fields
    created_by UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    featured_order INTEGER, -- for homepage ordering
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event highlights/features
CREATE TABLE event_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    highlight_order INTEGER DEFAULT 0,
    icon VARCHAR(50), -- lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER EVENT PARTICIPATION  
-- =============================================

-- User event registrations and progress (simplified 3-phase system)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    -- Registration info
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registration_status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, started, finished, scratched, dnf
    
    -- Simplified 3-phase onboarding progress (Register/Start Line/End)
    current_step_id INTEGER DEFAULT 0,
    current_phase VARCHAR(20) DEFAULT 'before', -- before, starting, after
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Event participation
    start_time TIMESTAMP WITH TIME ZONE,
    finish_time TIMESTAMP WITH TIME ZONE,
    scratch_decision VARCHAR(20), -- continue, scratch
    scratch_reason TEXT,
    
    -- Results
    final_time_hours DECIMAL(5,2), -- hours with decimal
    final_distance_km DECIMAL(6,2),
    points_earned INTEGER DEFAULT 0,
    
    -- Safety and tracking
    emergency_contact JSONB, -- {name, phone, relationship}
    tracker_details JSONB, -- device info, tracking URLs
    
    -- Post-event data  
    post_ride_reflection JSONB, -- mood, experience, feedback
    shared_results BOOLEAN DEFAULT false,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user per event
    UNIQUE(user_id, event_id)
);

-- =============================================
-- SIMPLIFIED STEP TRACKING
-- =============================================

-- Track individual step completions in simplified 3-phase process
CREATE TABLE user_step_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_event_id UUID REFERENCES user_events(id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_title VARCHAR(255),
    phase VARCHAR(20) NOT NULL, -- before, starting, after
    
    -- Progress tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    
    -- Step-specific data storage
    step_data JSONB DEFAULT '{}'::jsonb,
    
    -- Validation
    validation_status VARCHAR(20) DEFAULT 'pending', -- pending, valid, invalid, skipped
    required_fields_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique step per user event
    UNIQUE(user_event_id, step_id)
);

-- =============================================
-- SESSION MANAGEMENT
-- =============================================

-- User sessions for continuity and recovery
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session state
    current_event_id UUID REFERENCES events(id),
    current_step_id INTEGER DEFAULT 0,
    current_phase VARCHAR(20) DEFAULT 'before',
    is_in_specific_event_flow BOOLEAN DEFAULT false,
    
    -- Session data
    session_data JSONB DEFAULT '{}'::jsonb,
    view_mode VARCHAR(50) DEFAULT 'home',
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- PURE POINTS SYSTEM (NO ACHIEVEMENTS)
-- =============================================

-- Points activity log - tracks every points transaction
-- Point values: Adding route (500), Completing route (200), Starting route (100), 
-- Community signup (50), Inviting friends (25), Social sharing (10)
CREATE TABLE points_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Points transaction details
    points_earned INTEGER NOT NULL, -- can be negative for deductions
    points_type VARCHAR(50) NOT NULL, -- route_add, route_complete, route_start, community_signup, referral, social_share
    source_type VARCHAR(50) NOT NULL, -- event, admin, system, referral, social
    source_id UUID, -- references the source (event_id, etc.)
    
    -- Activity context
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Related records
    user_event_id UUID REFERENCES user_events(id) ON DELETE SET NULL,
    referral_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- if from referral
    
    -- Admin/system info
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- admin who awarded manual points
    is_manual BOOLEAN DEFAULT false,
    is_reversed BOOLEAN DEFAULT false,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reversal_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2025 LEADERBOARD SYSTEM
-- =============================================

-- Current year leaderboard snapshots (2025 only - no historical data)
CREATE TABLE leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Snapshot metadata (2025 only)
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly, event
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    
    -- User stats at snapshot time
    total_points INTEGER NOT NULL,
    rank_position INTEGER,
    points_since_last_snapshot INTEGER DEFAULT 0,
    events_completed INTEGER DEFAULT 0,
    
    -- Additional metrics
    avg_event_time DECIMAL(5,2), -- average completion time in hours
    fastest_event_time DECIMAL(5,2),
    total_distance_km DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user per snapshot period
    UNIQUE(user_id, snapshot_date, snapshot_type, event_id)
);

-- Current year winners (2025 only)
CREATE TABLE annual_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Winner details (2025 only)
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 2025,
    category VARCHAR(50) NOT NULL, -- overall_points, most_events, fastest_average, community_champion
    
    -- Winner stats
    points_earned INTEGER,
    events_completed INTEGER,
    winning_metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20), -- hours, points, events
    
    -- Award details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prize_description TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    announced_at TIMESTAMP WITH TIME ZONE,
    announced_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Runner-up information
    runner_up_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    runner_up_value DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique category per year
    UNIQUE(year, category)
);

-- =============================================
-- COMMUNITY FEATURES
-- =============================================

-- Community invitations and referrals (25 points for inviting friends)
CREATE TABLE community_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Invitation details
    invited_email VARCHAR(255) NOT NULL,
    invitation_message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, cancelled
    
    -- Referral tracking
    invited_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_points_awarded INTEGER DEFAULT 25,
    referral_points_awarded_at TIMESTAMP WITH TIME ZONE,
    
    -- Invitation lifecycle
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Tracking
    invitation_token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    clicked_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYSTEM TABLES
-- =============================================

-- App configuration and feature flags
CREATE TABLE app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_total_points ON users(total_points DESC);
CREATE INDEX idx_users_premium ON users(is_premium_subscriber);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_name ON users(first_name, last_name);

-- Event indexes
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(event_status);
CREATE INDEX idx_events_published ON events(is_published);
CREATE INDEX idx_events_location ON events(location);

-- User events indexes
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_event ON user_events(event_id);
CREATE INDEX idx_user_events_status ON user_events(registration_status);
CREATE INDEX idx_user_events_phase ON user_events(current_phase);

-- Step progress indexes
CREATE INDEX idx_step_progress_user_event ON user_step_progress(user_event_id);
CREATE INDEX idx_step_progress_step ON user_step_progress(step_id);
CREATE INDEX idx_step_progress_completed ON user_step_progress(is_completed);

-- Session indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Points activity indexes
CREATE INDEX idx_points_activity_user ON points_activity(user_id);
CREATE INDEX idx_points_activity_created ON points_activity(created_at);
CREATE INDEX idx_points_activity_type ON points_activity(points_type);
CREATE INDEX idx_points_activity_source ON points_activity(source_type, source_id);
CREATE INDEX idx_points_activity_event ON points_activity(user_event_id);
CREATE INDEX idx_points_activity_reversed ON points_activity(is_reversed);

-- Leaderboard indexes
CREATE INDEX idx_leaderboard_snapshots_user ON leaderboard_snapshots(user_id);
CREATE INDEX idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date);
CREATE INDEX idx_leaderboard_snapshots_type ON leaderboard_snapshots(snapshot_type);
CREATE INDEX idx_leaderboard_snapshots_rank ON leaderboard_snapshots(rank_position);
CREATE INDEX idx_leaderboard_snapshots_points ON leaderboard_snapshots(total_points DESC);

-- Annual winners indexes
CREATE INDEX idx_annual_winners_year ON annual_winners(year);
CREATE INDEX idx_annual_winners_category ON annual_winners(category);
CREATE INDEX idx_annual_winners_user ON annual_winners(user_id);
CREATE INDEX idx_annual_winners_verified ON annual_winners(is_verified);

-- Community invitations indexes
CREATE INDEX idx_invitations_inviter ON community_invitations(inviter_id);
CREATE INDEX idx_invitations_email ON community_invitations(invited_email);
CREATE INDEX idx_invitations_status ON community_invitations(status);
CREATE INDEX idx_invitations_token ON community_invitations(invitation_token);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Events are publicly readable when published
CREATE POLICY "Published events are public" ON events
    FOR SELECT USING (is_published = true);

-- Event highlights follow event visibility
CREATE POLICY "Event highlights follow event visibility" ON event_highlights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_highlights.event_id 
            AND events.is_published = true
        )
    );

-- Users can manage their own event registrations
CREATE POLICY "Users can manage own registrations" ON user_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_events.user_id 
            AND users.email = auth.jwt() ->> 'email'
        )
    );

-- Users can manage their own step progress
CREATE POLICY "Users can manage own step progress" ON user_step_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_events 
            JOIN users ON users.id = user_events.user_id
            WHERE user_events.id = user_step_progress.user_event_id 
            AND users.email = auth.jwt() ->> 'email'
        )
    );

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_sessions.user_id 
            AND users.email = auth.jwt() ->> 'email'
        )
    );

-- Users can read their own points activity
CREATE POLICY "Users can read own points activity" ON points_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = points_activity.user_id 
            AND users.email = auth.jwt() ->> 'email'
        )
    );

-- Leaderboard snapshots are publicly readable
CREATE POLICY "Leaderboard snapshots are public" ON leaderboard_snapshots
    FOR SELECT TO PUBLIC USING (true);

-- Annual winners are publicly readable when verified
CREATE POLICY "Verified annual winners are public" ON annual_winners
    FOR SELECT TO PUBLIC USING (is_verified = true);

-- Users can manage their own invitations
CREATE POLICY "Users can manage own invitations" ON community_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = community_invitations.inviter_id 
            AND users.email = auth.jwt() ->> 'email'
        )
    );

-- Anyone can read invitation details by token (for signup flow)
CREATE POLICY "Invitations readable by token" ON community_invitations
    FOR SELECT TO PUBLIC USING (status = 'pending' AND expires_at > NOW());

-- App config is publicly readable for active configs
CREATE POLICY "Active app config is public" ON app_config
    FOR SELECT TO PUBLIC USING (is_active = true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_events_updated_at BEFORE UPDATE ON user_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_step_progress_updated_at BEFORE UPDATE ON user_step_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user points from all sources
CREATE OR REPLACE FUNCTION calculate_user_points(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
BEGIN
    -- Sum all points from activity log (excluding reversals)
    SELECT COALESCE(SUM(
        CASE WHEN is_reversed THEN 0 ELSE points_earned END
    ), 0) INTO total_points
    FROM points_activity 
    WHERE user_id = user_uuid;
    
    -- Update user record
    UPDATE users SET total_points = total_points WHERE id = user_uuid;
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for various activities
-- Point values: Adding route (500), Completing route (200), Starting route (100),
-- Community signup (50), Inviting friends (25), Social sharing (10)
CREATE OR REPLACE FUNCTION award_points(
    user_uuid UUID,
    points INTEGER,
    points_type VARCHAR(50),
    source_type VARCHAR(50),
    source_uuid UUID DEFAULT NULL,
    description_text TEXT DEFAULT '',
    event_uuid UUID DEFAULT NULL,
    awarded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_uuid UUID;
BEGIN
    -- Insert points activity
    INSERT INTO points_activity (
        user_id, 
        points_earned, 
        points_type, 
        source_type, 
        source_id, 
        description,
        user_event_id,
        created_by,
        is_manual
    ) VALUES (
        user_uuid, 
        points, 
        points_type, 
        source_type, 
        source_uuid, 
        description_text,
        event_uuid,
        awarded_by,
        awarded_by IS NOT NULL
    ) RETURNING id INTO activity_uuid;
    
    -- Recalculate user points
    PERFORM calculate_user_points(user_uuid);
    
    RETURN activity_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update display_name from first_name + last_name
CREATE OR REPLACE FUNCTION update_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        NEW.display_name = NEW.first_name || ' ' || NEW.last_name;
    ELSIF NEW.first_name IS NOT NULL THEN
        NEW.display_name = NEW.first_name;
    ELSIF NEW.last_name IS NOT NULL THEN
        NEW.display_name = NEW.last_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update display_name when name fields change
CREATE TRIGGER update_user_display_name BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_display_name();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default point values configuration
INSERT INTO app_config (config_key, config_value, description) VALUES 
('point_values', '{
    "route_add": 500,
    "route_complete": 200, 
    "route_start": 100,
    "community_signup": 50,
    "referral": 25,
    "social_share": 10
}'::jsonb, 'Point values for different activities'),
('current_year', '{"year": 2025}'::jsonb, 'Current leaderboard year');