-- =============================================
-- Email Reminder Analytics Functions
-- =============================================

-- Function to get email reminder statistics
CREATE OR REPLACE FUNCTION get_email_reminder_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sent', (
      SELECT COUNT(*) FROM email_reminder_log
    ),
    'sent_last_24h', (
      SELECT COUNT(*) 
      FROM email_reminder_log 
      WHERE sent_at >= NOW() - INTERVAL '24 hours'
    ),
    'sent_last_7d', (
      SELECT COUNT(*) 
      FROM email_reminder_log 
      WHERE sent_at >= NOW() - INTERVAL '7 days'
    ),
    'sent_last_30d', (
      SELECT COUNT(*) 
      FROM email_reminder_log 
      WHERE sent_at >= NOW() - INTERVAL '30 days'
    ),
    'by_phase', (
      SELECT json_build_object(
        'register', COUNT(*) FILTER (WHERE reminder_phase = 'register'),
        'start_line', COUNT(*) FILTER (WHERE reminder_phase = 'start_line'),
        'end', COUNT(*) FILTER (WHERE reminder_phase = 'end')
      )
      FROM email_reminder_log
    ),
    'avg_completion_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE user_completed_after_email = true)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100), 
        2
      )
      FROM email_reminder_log
    ),
    'avg_days_to_completion', (
      SELECT ROUND(
        AVG(EXTRACT(EPOCH FROM (completed_at - sent_at)) / 86400), 
        2
      )
      FROM email_reminder_log
      WHERE user_completed_after_email = true
        AND completed_at IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_email_reminder_stats IS 'Returns comprehensive statistics about reminder emails';

-- Function to mark email as opened (called via webhook)
CREATE OR REPLACE FUNCTION mark_email_opened(
  p_message_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
  UPDATE email_reminder_log
  SET 
    email_opened = true,
    updated_at = NOW()
  WHERE mailersend_message_id = p_message_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_email_opened IS 'Marks an email as opened via MailerSend webhook';

-- Function to mark email as clicked (called via webhook)
CREATE OR REPLACE FUNCTION mark_email_clicked(
  p_message_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
  UPDATE email_reminder_log
  SET 
    email_clicked = true,
    updated_at = NOW()
  WHERE mailersend_message_id = p_message_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_email_clicked IS 'Marks an email as clicked via MailerSend webhook';

-- Function to mark user completed after email
CREATE OR REPLACE FUNCTION mark_user_completed_after_email(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE email_reminder_log
  SET 
    user_completed_after_email = true,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND event_id = p_event_id
    AND user_completed_after_email = false
    -- Only mark emails sent in the last 30 days as "completed after email"
    AND sent_at >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_user_completed_after_email IS 'Marks that a user completed registration after receiving reminder email';

-- Trigger to automatically mark completion when user completes registration
CREATE OR REPLACE FUNCTION trigger_mark_completion_after_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If registration status changes to completed
  IF NEW.registration_status = 'completed' 
     AND (OLD.registration_status IS NULL OR OLD.registration_status != 'completed') THEN
    
    -- Mark any recent reminder emails as resulting in completion
    PERFORM mark_user_completed_after_email(NEW.user_id, NEW.event_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_events table
DROP TRIGGER IF EXISTS after_registration_completed ON user_events;
CREATE TRIGGER after_registration_completed
  AFTER UPDATE ON user_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_mark_completion_after_email();

COMMENT ON TRIGGER after_registration_completed ON user_events IS 'Automatically tracks when users complete registration after receiving reminder email';

-- View for easy analytics querying
CREATE OR REPLACE VIEW v_email_reminder_analytics AS
SELECT 
  erl.*,
  u.email as user_email,
  u.display_name,
  e.name as event_name,
  e.event_date,
  ue.registration_status,
  ue.current_step_id,
  -- Calculate if completed within 30 days of email
  CASE 
    WHEN erl.user_completed_after_email = true 
    THEN EXTRACT(EPOCH FROM (erl.completed_at - erl.sent_at)) / 86400 
    ELSE NULL 
  END as days_to_completion
FROM email_reminder_log erl
LEFT JOIN users u ON erl.user_id = u.id
LEFT JOIN events e ON erl.event_id = e.id
LEFT JOIN user_events ue ON erl.user_event_id = ue.id
ORDER BY erl.sent_at DESC;

COMMENT ON VIEW v_email_reminder_analytics IS 'Comprehensive view of email reminders with user and event details';

-- Grant permissions
-- GRANT EXECUTE ON FUNCTION get_email_reminder_stats TO authenticated;
-- GRANT EXECUTE ON FUNCTION mark_email_opened TO service_role;
-- GRANT EXECUTE ON FUNCTION mark_email_clicked TO service_role;
-- GRANT SELECT ON v_email_reminder_analytics TO authenticated;
