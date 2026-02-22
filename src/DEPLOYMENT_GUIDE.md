# Email Reminder System - Deployment Guide

## Overview

This guide walks you through deploying the complete automated email reminder system for incomplete registrations.

## Prerequisites

- Supabase project with database access
- MailerSend API key (already configured: `MAILERSEND_API_KEY`)
- Access to Supabase SQL Editor
- Access to Supabase Edge Functions

---

## Step 1: Run Database Migrations

### 1.1 Add Tracking Columns

Open Supabase SQL Editor and run:

```sql
-- File: /supabase/migrations/add_email_reminder_tracking.sql
```

Copy the entire contents of `/supabase/migrations/add_email_reminder_tracking.sql` and execute it.

This creates:
- ✅ `last_reminder_sent_at`, `reminder_count`, `reminder_phase` columns on `user_events`
- ✅ `email_reminder_log` table for tracking all sends
- ✅ Helper function `get_reminder_eligible_registrations()`
- ✅ Helper function `update_reminder_sent()`

### 1.2 Add Analytics Functions

Run the second migration:

```sql
-- File: /supabase/migrations/add_email_analytics_functions.sql
```

Copy and execute `/supabase/migrations/add_email_analytics_functions.sql`.

This creates:
- ✅ `get_email_reminder_stats()` function for analytics
- ✅ `mark_email_opened()`, `mark_email_clicked()` for webhook tracking
- ✅ `mark_user_completed_after_email()` for conversion tracking
- ✅ Auto-trigger to mark completions
- ✅ `v_email_reminder_analytics` view

### 1.3 Verify Migrations

Check that everything was created:

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_events' 
  AND column_name IN ('last_reminder_sent_at', 'reminder_count', 'reminder_phase');

-- Check table exists
SELECT COUNT(*) FROM email_reminder_log;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%reminder%';
```

---

## Step 2: Deploy Edge Function

### 2.1 Install Supabase CLI

If you haven't already:

```bash
npm install -g supabase
```

### 2.2 Login to Supabase

```bash
supabase login
```

### 2.3 Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in: Supabase Dashboard > Project Settings > General

### 2.4 Deploy the Function

```bash
supabase functions deploy send-incomplete-registration-reminders
```

This deploys `/supabase/functions/send-incomplete-registration-reminders/index.ts`

### 2.5 Verify Deployment

Test the function manually:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-incomplete-registration-reminders' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## Step 3: Set Up Cron Job

### 3.1 Via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find `send-incomplete-registration-reminders`
3. Click **"Manage"** → **"Cron Jobs"**
4. Click **"Create Cron Job"**

### 3.2 Configure Schedule

- **Name**: `Daily Incomplete Registration Reminders`
- **Schedule**: `0 9 * * *` (Every day at 9:00 AM UTC)
- **Request body**: Leave empty (function doesn't need params)

### 3.3 Alternative: pg_cron (if available)

If your Supabase plan supports `pg_cron`:

```sql
SELECT cron.schedule(
  'send-incomplete-reminders',  -- name
  '0 9 * * *',                  -- schedule (9am daily)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-incomplete-registration-reminders',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

### 3.4 Recommended Schedules

- **Daily at 9am**: `0 9 * * *` (Best for most cases)
- **Twice daily**: `0 9,21 * * *` (9am and 9pm)
- **Every 6 hours**: `0 */6 * * *` (High frequency)
- **Monday/Wednesday/Friday**: `0 9 * * 1,3,5`

---

## Step 4: Add Analytics Dashboard

### 4.1 Add Component to Your App

Import the analytics component:

```tsx
import { EmailReminderAnalytics } from './components/EmailReminderAnalytics';
```

### 4.2 Add to Settings/Admin Page

```tsx
function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      {/* Email Reminder Analytics */}
      <EmailReminderAnalytics />
    </div>
  );
}
```

### 4.3 Configure Permissions

Ensure the `email_reminder_log` table has proper RLS policies:

```sql
-- Allow authenticated users to read their own reminder logs
CREATE POLICY "Users can view their own reminder emails"
  ON email_reminder_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role has full access"
  ON email_reminder_log
  FOR ALL
  TO service_role
  USING (true);
```

---

## Step 5: Test the Complete System

### 5.1 Create Test Incomplete Registration

1. Sign in to hub.gravalist.com
2. Start registration for any ride
3. Complete 2-3 steps
4. Navigate away without completing

### 5.2 Manual Trigger Test

Use the test button component:

```tsx
import { SendReminderEmailButton } from './components/SendReminderEmailButton';

<SendReminderEmailButton 
  eventId="your-event-uuid"
  eventName="Test Ride 500"
  currentPhase="register"
/>
```

Click the button → Check your email inbox

### 5.3 Automated Job Test

Wait 24 hours OR manually trigger the function:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-incomplete-registration-reminders' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

Check the response for results:

```json
{
  "success": true,
  "total": 5,
  "sent": 3,
  "failed": 0,
  "skipped": 2,
  "details": [...]
}
```

### 5.4 Verify in Database

```sql
-- Check that reminders were logged
SELECT * FROM email_reminder_log ORDER BY sent_at DESC LIMIT 10;

-- Check that user_events were updated
SELECT 
  u.email,
  e.name,
  ue.last_reminder_sent_at,
  ue.reminder_count,
  ue.reminder_phase
FROM user_events ue
JOIN users u ON ue.user_id = u.id
JOIN events e ON ue.event_id = e.id
WHERE ue.reminder_count > 0
ORDER BY ue.last_reminder_sent_at DESC;
```

---

## Step 6: Monitor and Optimize

### 6.1 View Edge Function Logs

Supabase Dashboard → Edge Functions → `send-incomplete-registration-reminders` → Logs

Look for:
- ✅ `Found X eligible registrations`
- ✅ `Email sent successfully to...`
- ❌ Any error messages

### 6.2 Check Email Analytics

In your admin dashboard, view the `EmailReminderAnalytics` component to see:
- Total emails sent
- Emails by phase
- Completion rate (users who completed after receiving email)
- Average time to completion

### 6.3 Query Raw Analytics

```sql
-- Get completion rate by phase
SELECT 
  reminder_phase,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE user_completed_after_email = true) as completed,
  ROUND(
    COUNT(*) FILTER (WHERE user_completed_after_email = true)::DECIMAL / 
    COUNT(*) * 100, 
    2
  ) as completion_rate_pct
FROM email_reminder_log
GROUP BY reminder_phase;

-- Get average days to completion
SELECT 
  reminder_phase,
  ROUND(AVG(days_to_completion), 2) as avg_days_to_complete
FROM v_email_reminder_analytics
WHERE user_completed_after_email = true
GROUP BY reminder_phase;
```

### 6.4 Optimize Sending Times

Based on analytics, adjust your cron schedule:

```sql
-- If register phase has best completion in evening
-- Change to: 0 18 * * * (6pm daily)

-- If start_line works better on event day
-- Run more frequently: 0 */4 * * *
```

---

## Step 7: Configure MailerSend Webhooks (Optional)

To track opens and clicks:

### 7.1 Create Webhook Endpoint

In `/supabase/functions/server/index.tsx`, add:

```typescript
app.post('/make-server-91bdaa9f/mailersend-webhook', async (c) => {
  const data = await c.req.json();
  
  if (data.type === 'activity.opened') {
    await supabase.rpc('mark_email_opened', {
      p_message_id: data.data.email.message.id
    });
  }
  
  if (data.type === 'activity.clicked') {
    await supabase.rpc('mark_email_clicked', {
      p_message_id: data.data.email.message.id
    });
  }
  
  return c.json({ success: true });
});
```

### 7.2 Configure in MailerSend

1. Go to MailerSend Dashboard → Webhooks
2. Add webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/make-server-91bdaa9f/mailersend-webhook`
3. Enable events: `activity.opened`, `activity.clicked`

---

## Troubleshooting

### Emails Not Sending

1. **Check function logs** for errors
2. **Verify MailerSend API key** is set
3. **Check eligible registrations**:
   ```sql
   SELECT * FROM get_reminder_eligible_registrations();
   ```

### No Eligible Users Found

- Users must have `current_step_id > 0`
- Must be inactive for 24+ hours
- Max 3 reminders per user
- Must not be completed

### Database Errors

- Ensure migrations ran successfully
- Check table/column exists
- Verify function permissions

---

## Success Criteria

✅ **Migrations completed** without errors  
✅ **Edge function deployed** and callable  
✅ **Cron job scheduled** and running  
✅ **Test emails received** within 1 minute  
✅ **Analytics dashboard** shows data  
✅ **Completion rate** tracking works  

---

## Next Steps

1. Monitor for 7 days
2. Review completion rates by phase
3. Adjust timing based on data
4. Consider A/B testing email content
5. Set up alerts for failed sends

Congratulations! Your automated email reminder system is live. 🎉
