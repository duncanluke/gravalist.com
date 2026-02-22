-- =============================================
-- SAMPLE DATA FOR GRAVALIST PLATFORM
-- =============================================

-- Insert sample events (500-series ultra cycling events)
INSERT INTO events (
    id,
    name,
    slug,
    location,
    timezone,
    event_date,
    event_time,
    distance_km,
    description,
    route_description,
    event_tags,
    difficulty_level,
    registration_opens_at,
    registration_closes_at,
    event_status,
    gpx_file_path,
    gpx_file_name,
    gpx_file_size,
    gpx_file_uploaded_at,
    is_published,
    featured_order
) VALUES 
(
    uuid_generate_v4(),
    'Utrecht 500',
    'utrecht-500',
    'Utrecht, Netherlands',
    'Europe/Amsterdam',
    '2025-09-19',
    '06:00:00',
    500,
    'A challenging 500km ultra cycling route through the beautiful Dutch countryside, starting and finishing in historic Utrecht.',
    'The route takes you through the heart of the Netherlands, featuring rolling hills, charming villages, and scenic waterways. Expect mixed terrain with well-maintained roads and some challenging climbs.',
    ARRAY['Unsupported', 'Ultracycling', 'Self-Managed'],
    'Advanced',
    NOW() - INTERVAL '30 days',
    '2025-09-18 18:00:00+02',
    'registration_open',
    'routes/utrecht-500/route.gpx',
    'utrecht-500-route.gpx',
    245760, -- ~240KB sample GPX file size
    NOW() - INTERVAL '35 days',
    true,
    1
),
(
    uuid_generate_v4(),
    'Sedgefield 500',
    'sedgefield-500',
    'Sedgefield, South Africa',
    'Africa/Johannesburg',
    '2024-10-12',
    '05:00:00',
    500,
    'Experience the rugged beauty of the Garden Route with this challenging 500km ultra cycling event through South Africa''s coastal paradise.',
    'Starting from Sedgefield, this route winds through indigenous forests, coastal roads, and mountain passes. A true test of endurance with spectacular scenery.',
    ARRAY['Unsupported', 'Ultracycling', 'Coastal'],
    'Expert',
    NOW() - INTERVAL '60 days',
    '2024-10-11 17:00:00+02',
    'completed',
    'routes/sedgefield-500/route.gpx',
    'sedgefield-500-route.gpx',
    198656, -- ~194KB sample GPX file size
    NOW() - INTERVAL '65 days',
    true,
    2
),
(
    uuid_generate_v4(),
    'Franschhoek 500',
    'franschhoek-500',
    'Franschhoek, South Africa',
    'Africa/Johannesburg',
    '2024-11-08',
    '05:30:00',
    500,
    'Ride through South Africa''s wine country in this spectacular 500km ultra cycling challenge through the Cape Winelands.',
    'This route showcases the best of the Cape Winelands, with challenging mountain passes, vineyard valleys, and historic towns. Expect significant elevation and stunning views.',
    ARRAY['Unsupported', 'Ultracycling', 'Mountain'],
    'Expert',
    NOW() - INTERVAL '90 days',
    '2024-11-07 18:00:00+02',
    'completed',
    'routes/franschhoek-500/route.gpx',
    'franschhoek-500-route.gpx',
    312320, -- ~305KB sample GPX file size
    NOW() - INTERVAL '95 days',
    true,
    3
),
(
    uuid_generate_v4(),
    'Cape Hope 500',
    'cape-hope-500',
    'Cape of Good Hope, South Africa',
    'Africa/Johannesburg',
    '2025-02-14',
    '05:00:00',
    500,
    'An epic Valentine''s Day adventure to the southwestern tip of Africa, featuring coastal roads, mountain climbs, and the iconic Cape Point.',
    'This route takes you from Cape Town to Cape Point and back, featuring some of the most spectacular coastal and mountain scenery in the world. Expect wind, hills, and incredible views.',
    ARRAY['Unsupported', 'Ultracycling', 'Coastal', 'Mountain'],
    'Expert',
    NOW() - INTERVAL '10 days',
    '2025-02-13 18:00:00+02',
    'registration_open',
    'routes/cape-hope-500/route.gpx',
    'cape-hope-500-route.gpx',
    267264, -- ~261KB sample GPX file size
    NOW() - INTERVAL '15 days',
    true,
    4
);

-- Insert event highlights for Utrecht 500
INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Historic City Start',
    'Begin your journey in the medieval heart of Utrecht, one of the Netherlands'' oldest cities.',
    1,
    'building'
FROM events e WHERE e.slug = 'utrecht-500';

INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Scenic Waterways',
    'Cycle alongside pristine canals and rivers that define the Dutch landscape.',
    2,
    'waves'
FROM events e WHERE e.slug = 'utrecht-500';

INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Rural Villages',
    'Experience charming Dutch countryside villages with traditional architecture.',
    3,
    'home'
FROM events e WHERE e.slug = 'utrecht-500';

-- Insert event highlights for Cape Hope 500
INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Two Oceans Meet',
    'Witness where the Atlantic and Indian Oceans converge at Cape Point.',
    1,
    'waves'
FROM events e WHERE e.slug = 'cape-hope-500';

INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Chapman''s Peak',
    'Conquer one of the world''s most scenic coastal drives on two wheels.',
    2,
    'mountain'
FROM events e WHERE e.slug = 'cape-hope-500';

INSERT INTO event_highlights (event_id, title, description, highlight_order, icon)
SELECT 
    e.id,
    'Cape Point Lighthouse',
    'Reach the iconic lighthouse at the southwestern tip of Africa.',
    3,
    'lighthouse'
FROM events e WHERE e.slug = 'cape-hope-500';

-- Insert sample app configuration
INSERT INTO app_config (config_key, config_value, description, is_active) VALUES 
('featured_events', '["utrecht-500", "cape-hope-500"]'::jsonb, 'List of event slugs to feature on homepage', true),
('max_events_per_user', '{"limit": 5}'::jsonb, 'Maximum number of events a user can register for simultaneously', true),
('registration_settings', '{"require_emergency_contact": true, "require_insurance": true, "min_age": 18}'::jsonb, 'Registration requirements and settings', true);