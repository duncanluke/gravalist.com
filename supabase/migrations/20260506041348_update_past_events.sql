UPDATE public.events
SET 
  event_date = (date_trunc('week', event_date + interval '1 year') + interval '4 days')::date,
  registration_opens_at = registration_opens_at + interval '1 year',
  registration_closes_at = registration_closes_at + interval '1 year'
WHERE slug IN ('franschhoek-500', 'clarens-500');
