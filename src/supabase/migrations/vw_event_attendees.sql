-- Migration: Add Event Attendees View
-- This view provides a simple, readable table in Supabase Studio 
-- to see exactly which riders have paid for and registered for which events.

CREATE OR REPLACE VIEW vw_event_attendees AS
SELECT 
    e.name AS event_name,
    e.event_date,
    u.display_name AS rider_name,
    u.email AS rider_email,
    u.city AS rider_city,
    ue.registration_status,
    ue.registered_at AS paid_and_registered_on,
    ue.user_id,
    ue.event_id
FROM 
    user_events ue
JOIN 
    events e ON ue.event_id = e.id
JOIN 
    users u ON ue.user_id = u.id
ORDER BY 
    e.event_date ASC, 
    ue.registered_at DESC;

-- Grant permissions for authenticated users to view this if needed for future Admin dashboards
GRANT SELECT ON vw_event_attendees TO authenticated;
GRANT SELECT ON vw_event_attendees TO service_role;
