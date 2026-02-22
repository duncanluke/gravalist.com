-- =============================================
-- SAFE SCHEMA - Uses IF NOT EXISTS to prevent conflicts
-- =============================================
-- This version can be run multiple times safely

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE USER MANAGEMENT
-- =============================================

-- Users table with email-based identification for privacy
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    location VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    event_date DATE NOT NULL,
    event_time TIME,
    
    -- Event details
    distance_km INTEGER DEFAULT 500,
    description TEXT,
    route_description TEXT,
    
    -- Event categorization
    event_tags TEXT[] DEFAULT ARRAY['Unsupported', 'Ultracycling'],
    difficulty_level VARCHAR(20) DEFAULT 'Advanced', -- Beginner, Intermediate, Advanced, Expert
    
    -- Registration
    max_riders INTEGER,
    registration_opens_at TIMESTAMP WITH TIME ZONE,
    registration_closes_at TIMESTAMP WITH TIME ZONE,
    event_status VARCHAR(20) DEFAULT 'planned', -- planned, registration_open, registration_closed, active, completed, cancelled
    
    -- Route data (GPX file support)
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
CREATE TABLE IF NOT EXISTS event_highlights (
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
CREATE TABLE IF NOT EXISTS user_events (
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
CREATE TABLE IF NOT EXISTS user_step_progress (
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
CREATE TABLE IF NOT EXISTS user_sessions (
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
CREATE TABLE IF NOT EXISTS points_activity (
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
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
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
CREATE TABLE IF NOT EXISTS annual_winners (
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
CREATE TABLE IF NOT EXISTS community_invitations (
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
CREATE TABLE IF NOT EXISTS app_config (
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

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    -- User indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_total_points') THEN
        CREATE INDEX idx_users_total_points ON users(total_points DESC);
    END IF;
    
    -- Event indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_slug') THEN
        CREATE INDEX idx_events_slug ON events(slug);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_status') THEN
        CREATE INDEX idx_events_status ON events(event_status);
    END IF;
    
    -- User events indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_events_user') THEN
        CREATE INDEX idx_user_events_user ON user_events(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_events_event') THEN
        CREATE INDEX idx_user_events_event ON user_events(event_id);
    END IF;
END $$;

-- Insert default configuration if it doesn't exist
INSERT INTO app_config (config_key, config_value, description) 
SELECT 'point_values', '{
    "route_add": 500,
    "route_complete": 200, 
    "route_start": 100,
    "community_signup": 50,
    "referral": 25,
    "social_share": 10
}'::jsonb, 'Point values for different activities'
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE config_key = 'point_values');

INSERT INTO app_config (config_key, config_value, description) 
SELECT 'current_year', '{"year": 2025}'::jsonb, 'Current leaderboard year'
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE config_key = 'current_year');