-- Migration to add Stripe subscription fields to users table
-- Add subscription-related columns if they don't exist

DO $$
BEGIN
    -- Add subscription_tier column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
        ALTER TABLE users ADD COLUMN subscription_tier TEXT;
    END IF;

    -- Add subscription_started_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_started_at') THEN
        ALTER TABLE users ADD COLUMN subscription_started_at TIMESTAMPTZ;
    END IF;

    -- Add subscription_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;

    -- Add stripe_subscription_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- Ensure is_premium_subscriber has a default value
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'is_premium_subscriber' 
               AND column_default IS NULL) THEN
        ALTER TABLE users ALTER COLUMN is_premium_subscriber SET DEFAULT false;
    END IF;

    -- Ensure subscription_status has a default value
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'subscription_status' 
               AND column_default IS NULL) THEN
        ALTER TABLE users ALTER COLUMN subscription_status SET DEFAULT 'inactive';
    END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_is_premium_subscriber ON users(is_premium_subscriber);

-- Add comments to document the fields
COMMENT ON COLUMN users.subscription_tier IS 'The tier of subscription (e.g., annual, monthly)';
COMMENT ON COLUMN users.subscription_started_at IS 'When the current subscription period started';
COMMENT ON COLUMN users.subscription_expires_at IS 'When the current subscription period expires';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for managing the subscription';
COMMENT ON COLUMN users.is_premium_subscriber IS 'Whether user currently has active premium access';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status (active, canceled, incomplete, etc.)';