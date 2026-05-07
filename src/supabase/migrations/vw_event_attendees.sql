-- Migration: Add Event Attendees View
-- This view provides a simple, readable table in Supabase Studio 
-- to see exactly which riders have paid for and registered for which events.

CREATE OR REPLACE VIEW vw_event_attendees AS
SELECT 
    COALESCE(e.name, 'Unassigned (Generic Entry)') AS event_name,
    e.event_date,
    u.display_name AS rider_name,
    u.email AS rider_email,
    u.city AS rider_city,
    u.is_premium_subscriber AS has_paid,
    COALESCE(ue.registration_status, 'paid_but_unassigned') AS registration_status,
    COALESCE(ue.registered_at, u.subscription_started_at) AS paid_and_registered_on,
    u.id AS user_id,
    e.id AS event_id
FROM 
    users u
LEFT JOIN 
    user_events ue ON u.id = ue.user_id
LEFT JOIN 
    events e ON ue.event_id = e.id
WHERE 
    u.is_premium_subscriber = true 
    OR ue.registration_status = 'confirmed'
ORDER BY 
    e.event_date ASC NULLS FIRST, 
    paid_and_registered_on DESC;

-- Grant permissions for authenticated users to view this if needed for future Admin dashboards
GRANT SELECT ON vw_event_attendees TO authenticated;
GRANT SELECT ON vw_event_attendees TO service_role;
